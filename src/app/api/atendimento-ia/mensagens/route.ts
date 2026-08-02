import { type NextRequest } from "next/server";

import { executarOrquestradorMensagem } from "@/features/atendimento-ia/actions/executar-orquestrador-mensagem";
import { RepositorioEntradaAtendimentoDrizzle } from "@/features/atendimento-ia/actions/repositorio-entrada-atendimento-drizzle";
import { RepositorioSegurancaObservabilidadeDrizzle } from "@/features/atendimento-ia/actions/repositorio-seguranca-observabilidade-drizzle";
import { RepositorioTransferenciaHumanaDrizzle } from "@/features/atendimento-ia/actions/repositorio-transferencia-humana-drizzle";
import { MODELO_PRINCIPAL_ATENDENTE_IA } from "@/features/atendimento-ia/constants/configuracao-atendente";
import {
  ErroContratoRespostaChat,
  NOME_CONTRATO_RESPOSTA_CHAT,
  validarContratoRespostaChat,
} from "@/features/atendimento-ia/lib/contrato-resposta-chat";
import {
  aplicarCookieSessaoAtendimento,
  resolverIdentidadeRequisicao,
} from "@/features/atendimento-ia/lib/identidade-requisicao-atendimento";
import { obterConfiguracaoAtendenteIa } from "@/features/atendimento-ia/lib/obter-configuracao-atendente";
import { processarRequisicaoEntradaMensagem } from "@/features/atendimento-ia/lib/processar-requisicao-entrada-mensagem";
import {
  criarCorrelacaoSegura,
  hashReferenciaSegura,
} from "@/features/atendimento-ia/lib/seguranca-observabilidade";
import { buscarHistoricoChat } from "@/features/atendimento-ia/queries/buscar-historico-chat";
import { buscarResultadoChat } from "@/features/atendimento-ia/queries/buscar-resultado-chat";
import type { ResultadoEntradaMensagem } from "@/features/atendimento-ia/types/entrada-mensagem";

export const runtime = "nodejs";

const PADRAO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function obterOrigemPermitida() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
  if (!url) throw new Error("ORIGEM_ATENDIMENTO_NAO_CONFIGURADA");
  return new URL(url).origin;
}

function codigoSeguroDoErro(erro: unknown) {
  if (!(erro instanceof Error)) return "ERRO_NAO_CLASSIFICADO";
  if (/^[A-Z][A-Z0-9_]{2,80}$/.test(erro.message)) return erro.message;
  const codigo = (erro as Error & { code?: unknown }).code;
  return typeof codigo === "string" && /^[A-Z0-9_]{2,40}$/i.test(codigo)
    ? codigo
    : erro.name;
}

function categoriaSeguraDoErro(erro: unknown) {
  if (!(erro instanceof Error)) return "erro_interno_nao_classificado";
  const categoria = (erro as Error & { categoria?: unknown }).categoria;
  return typeof categoria === "string" &&
    /^[a-z][a-z0-9_]{2,60}$/.test(categoria)
    ? categoria
    : "erro_interno";
}

function componenteDaEtapa(etapa: string) {
  if (etapa === "limite_uso") return "limitador";
  if (etapa.includes("persistencia") || etapa.includes("recuperacao"))
    return "banco";
  if (etapa === "orquestrador") return "orquestrador";
  if (etapa === "serializacao_resposta") return "contrato_endpoint";
  return "endpoint";
}

export async function GET(requisicao: NextRequest) {
  const { identificadorSessao, usuarioId } =
    await resolverIdentidadeRequisicao(requisicao);
  const conversaId = requisicao.nextUrl.searchParams.get("conversaId");
  if (!conversaId || !PADRAO_UUID.test(conversaId)) {
    return aplicarCookieSessaoAtendimento(
      Response.json(
        {
          erro: { codigo: "ENTRADA_INVALIDA", mensagem: "Conversa inválida." },
          sucesso: false,
        },
        { status: 400 },
      ),
      requisicao,
      identificadorSessao,
    );
  }
  const historico = await buscarHistoricoChat({
    conversaId,
    identidade: { identificadorSessao, usuarioId },
  });
  const resposta = historico
    ? Response.json({ dados: historico, sucesso: true })
    : Response.json(
        {
          erro: {
            codigo: "CONVERSA_INDISPONIVEL",
            mensagem: "Esta conversa não está disponível nesta sessão.",
          },
          sucesso: false,
        },
        { status: 404 },
      );
  return aplicarCookieSessaoAtendimento(
    resposta,
    requisicao,
    identificadorSessao,
  );
}

export async function POST(requisicao: NextRequest) {
  const { identificadorSessao, usuarioId } =
    await resolverIdentidadeRequisicao(requisicao);

  let resposta: Response;
  let etapa = "configuracao";
  let execucaoId: string | null = null;
  let requestId: string | null = null;
  try {
    const configuracao = obterConfiguracaoAtendenteIa();
    if (!configuracao.ATENDENTE_IA_ATIVO) {
      console.warn("[atendimento-ia:configuracao]", {
        codigo: "ATENDENTE_IA_INATIVO",
        etapa: "validacao_configuracao",
      });
    }
    etapa = "limite_uso";
    const observabilidade = new RepositorioSegurancaObservabilidadeDrizzle();
    const limite = await observabilidade.consumirLimite({
      agora: new Date(),
      escopo: usuarioId ? "usuario" : "sessao",
      janelaEmMs: configuracao.ATENDENTE_IA_LIMITE_JANELA_SEGUNDOS * 1000,
      limite: configuracao.ATENDENTE_IA_LIMITE_MENSAGENS_JANELA,
      recurso: "entrada_mensagem",
      referencia: usuarioId ?? identificadorSessao,
    });
    if (!limite.permitido) {
      await observabilidade.registrar({
        categoria: "limite",
        correlacaoId: criarCorrelacaoSegura(),
        evento: "limite_atingido",
        metadados: {
          escopo: usuarioId ? "usuario" : "sessao",
          recurso: "entrada_mensagem",
        },
        referenciaSessaoHash: hashReferenciaSegura(identificadorSessao),
        resultado: "recusa",
        severidade: "atencao",
        tipoAtor: usuarioId ? "cliente_autenticado" : "visitante",
        usuarioId: usuarioId ?? undefined,
      });
      resposta = Response.json(
        {
          erro: {
            codigo: "LIMITE_ATINGIDO",
            mensagem: "Aguarde um momento antes de enviar outra mensagem.",
          },
          sucesso: false,
        },
        { status: 429 },
      );
      return aplicarCookieSessaoAtendimento(
        resposta,
        requisicao,
        identificadorSessao,
      );
    }
    etapa = "persistencia_entrada";
    const respostaEntrada = await processarRequisicaoEntradaMensagem(
      requisicao,
      {
        atendenteAtivo: configuracao.ATENDENTE_IA_ATIVO,
        contextoExpiraAposDias: usuarioId
          ? configuracao.ATENDENTE_IA_CONTEXTO_AUTENTICADO_DIAS
          : configuracao.ATENDENTE_IA_CONTEXTO_VISITANTE_DIAS,
        identidade: { identificadorSessao, usuarioId },
        origemPermitida: obterOrigemPermitida(),
        registrarTentativaManipulacao: () =>
          observabilidade
            .registrar({
              categoria: "seguranca",
              correlacaoId: criarCorrelacaoSegura(),
              evento: "evento_seguranca_bloqueado",
              metadados: { classe: "manipulacao_instrucoes_ou_argumentos" },
              referenciaSessaoHash: hashReferenciaSegura(identificadorSessao),
              resultado: "recusa",
              severidade: "atencao",
              tipoAtor: usuarioId ? "cliente_autenticado" : "visitante",
              usuarioId: usuarioId ?? undefined,
            })
            .then(() => undefined),
        repositorio: new RepositorioEntradaAtendimentoDrizzle(),
      },
    );
    if (!respostaEntrada.ok) {
      resposta = respostaEntrada;
    } else {
      etapa = "leitura_resultado_entrada";
      const entrada = (await respostaEntrada.json()) as {
        dados: ResultadoEntradaMensagem;
        sucesso: true;
      };
      const identidade = { identificadorSessao, usuarioId };
      etapa = "orquestrador";
      const orquestracao = await executarOrquestradorMensagem({
        identidade,
        mensagemId: entrada.dados.mensagemId,
      });
      execucaoId =
        "execucaoId" in orquestracao ? orquestracao.execucaoId : null;
      requestId = "requestId" in orquestracao ? orquestracao.requestId : null;

      if (
        orquestracao.tipo === "falha_definitiva" ||
        orquestracao.tipo === "falha_recuperavel"
      ) {
        console.warn("[atendimento-ia:endpoint]", {
          categoria: orquestracao.tipo,
          codigo: "PROCESSAMENTO_INDISPONIVEL",
          componente: "orquestrador",
          contrato: null,
          conversaId: entrada.dados.conversaId,
          execucaoId,
          etapa: "orquestrador",
          requestId,
          statusHttp: 503,
          temporaria: orquestracao.tipo === "falha_recuperavel",
        });
        resposta = Response.json(
          {
            erro: {
              codigo: "PROCESSAMENTO_INDISPONIVEL",
              mensagem:
                "Não consegui responder agora. Sua mensagem foi preservada e você pode tentar novamente.",
            },
            sucesso: false,
          },
          { status: 503 },
        );
      } else if (
        orquestracao.tipo === "em_processamento" ||
        orquestracao.tipo === "estado_incompativel"
      ) {
        resposta = Response.json(
          {
            erro: {
              codigo: "PROCESSAMENTO_EM_ANDAMENTO",
              mensagem: "Esta mensagem já está sendo processada.",
            },
            sucesso: false,
          },
          { status: 409 },
        );
      } else {
        if (
          orquestracao.tipo === "encaminhada" &&
          !orquestracao.mensagemRespostaId
        ) {
          throw new Error("RESULTADO_ORQUESTRADOR_SEM_RESPOSTA");
        }
        etapa = "recuperacao_resposta_persistida";
        const resultado = await buscarResultadoChat({
          identidade,
          mensagemClienteId: entrada.dados.mensagemId,
          mensagemRespostaId:
            orquestracao.tipo === "encaminhada"
              ? orquestracao.mensagemRespostaId
              : null,
        });
        if (!resultado) throw new Error("RESPOSTA_CHAT_INDISPONIVEL");

        let transferencia = null;
        if (orquestracao.tipo === "aguardando_atendimento_humano") {
          etapa = "recuperacao_transferencia";
          transferencia =
            await new RepositorioTransferenciaHumanaDrizzle().buscar(
              orquestracao.transferenciaId,
              identidade,
            );
        }
        etapa = "serializacao_resposta";
        const corpoResposta = validarContratoRespostaChat({
          dados: {
            conversaId: resultado.conversaId,
            mensagem: resultado.mensagem,
            mensagemClienteId: entrada.dados.mensagemId,
            transferencia: transferencia
              ? {
                  explicacao: resultado.mensagem.conteudo,
                  id: transferencia.id,
                  link: null,
                  resumo: transferencia.resumo,
                  status: transferencia.status,
                }
              : null,
          },
          sucesso: true,
        });
        resposta = Response.json(corpoResposta);
      }
    }
  } catch (erro) {
    const diagnosticoContrato =
      erro instanceof ErroContratoRespostaChat ? erro.diagnostico : null;
    console.error("[atendimento-ia:endpoint]", {
      categoria: categoriaSeguraDoErro(erro),
      codigo: codigoSeguroDoErro(erro),
      componente: componenteDaEtapa(etapa),
      contrato:
        erro instanceof ErroContratoRespostaChat
          ? NOME_CONTRATO_RESPOSTA_CHAT
          : null,
      execucaoId,
      camposAusentes: diagnosticoContrato?.camposAusentes ?? [],
      camposInvalidos: diagnosticoContrato?.camposInvalidos ?? [],
      camposInesperados: diagnosticoContrato?.camposInesperados ?? [],
      etapa,
      mensagemSanitizada: "Falha interna categorizada no endpoint.",
      modelo: MODELO_PRINCIPAL_ATENDENTE_IA,
      requestId,
      statusHttp: 503,
      temporaria:
        etapa.includes("persistencia") ||
        etapa.includes("recuperacao") ||
        etapa === "orquestrador",
      tipo: erro instanceof Error ? erro.name : "erro_desconhecido",
    });
    resposta = Response.json(
      {
        erro: {
          codigo: "ATENDENTE_INDISPONIVEL",
          mensagem: "O atendimento está indisponível no momento.",
        },
        sucesso: false,
      },
      { status: 503 },
    );
  }

  return aplicarCookieSessaoAtendimento(
    resposta,
    requisicao,
    identificadorSessao,
  );
}
