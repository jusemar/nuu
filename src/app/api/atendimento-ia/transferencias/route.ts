import { type NextRequest } from "next/server";
import { z } from "zod";

import { RepositorioConfirmacoesFerramentasDrizzle } from "@/features/atendimento-ia/actions/repositorio-confirmacoes-ferramentas-drizzle";
import { RepositorioTransferenciaHumanaDrizzle } from "@/features/atendimento-ia/actions/repositorio-transferencia-humana-drizzle";
import { aplicarCookieSessaoAtendimento, resolverIdentidadeRequisicao } from "@/features/atendimento-ia/lib/identidade-requisicao-atendimento";
import { obterConfiguracaoAtendenteIa } from "@/features/atendimento-ia/lib/obter-configuracao-atendente";
import { criarFluxoTransferenciaWhatsapp } from "@/features/atendimento-ia/lib/transferencia-humana/fluxo-transferencia-whatsapp";

export const runtime = "nodejs";

const base = { transferenciaId: z.string().uuid() };
const entradaSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("confirmar_oferta"), ...base }).strict(),
  z.object({ acao: z.literal("recusar"), ...base }).strict(),
  z.object({ acao: z.literal("cancelar"), ...base }).strict(),
  z.object({ acao: z.literal("confirmar_resumo"), resposta: z.literal("sim"), ...base }).strict(),
  z.object({ acao: z.literal("gerar_link"), chaveIdempotencia: z.string().uuid(), ...base }).strict(),
  z.object({ acao: z.literal("registrar_abertura"), ...base }).strict(),
  z.object({
    acao: z.literal("preparar_resumo_publico"),
    informacoesDeclaradas: z.array(z.string().trim().min(1).max(300)).max(5),
    interpretacaoNecessidade: z.string().trim().min(1).max(300),
    necessidadePrincipal: z.string().trim().min(1).max(300),
    pendenciaValidacaoHumana: z.string().trim().min(1).max(300),
    produtoRelacionado: z.string().trim().min(1).max(300).nullable(),
    ...base,
  }).strict(),
]);

function origemPermitida(requisicao: NextRequest) {
  const oficial = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
  return oficial && requisicao.headers.get("origin") === new URL(oficial).origin;
}

export async function POST(requisicao: NextRequest) {
  const identidade = await resolverIdentidadeRequisicao(requisicao);
  let resposta: Response;
  try {
    const tamanhoDeclarado = Number(requisicao.headers.get("content-length") ?? "0");
    if (!Number.isFinite(tamanhoDeclarado) || tamanhoDeclarado > 16_384) {
      resposta = Response.json({ sucesso: false, erro: { codigo: "REQUISICAO_MUITO_GRANDE" } }, { status: 413 });
    } else if (!origemPermitida(requisicao) || !requisicao.headers.get("content-type")?.startsWith("application/json")) {
      resposta = Response.json({ sucesso: false, erro: { codigo: "REQUISICAO_NAO_PERMITIDA" } }, { status: 403 });
    } else {
      const entrada = entradaSchema.parse(await requisicao.json());
      const configuracao = obterConfiguracaoAtendenteIa();
      const fluxo = criarFluxoTransferenciaWhatsapp({
        obterWhatsappOficial: () => configuracao.ATENDENTE_IA_WHATSAPP_OFICIAL,
        repositorio: new RepositorioTransferenciaHumanaDrizzle(),
        repositorioConfirmacoes: new RepositorioConfirmacoesFerramentasDrizzle(),
        validarDadosParticulares: async () => false,
        validadeEmMs: configuracao.ATENDENTE_IA_TRANSFERENCIA_VALIDADE_MS,
      });
      let dados: unknown;
      if (entrada.acao === "confirmar_oferta") dados = await fluxo.responderOferta({ aceitar: true, identidade, transferenciaId: entrada.transferenciaId });
      else if (entrada.acao === "recusar") dados = await fluxo.responderOferta({ aceitar: false, identidade, transferenciaId: entrada.transferenciaId });
      else if (entrada.acao === "cancelar") dados = await fluxo.cancelar({ identidade, transferenciaId: entrada.transferenciaId });
      else if (entrada.acao === "confirmar_resumo") dados = await fluxo.confirmarResumo({ identidade, resposta: entrada.resposta, transferenciaId: entrada.transferenciaId });
      else if (entrada.acao === "gerar_link") dados = await fluxo.gerarLink({ chaveIdempotencia: entrada.chaveIdempotencia, identidade, transferenciaId: entrada.transferenciaId });
      else if (entrada.acao === "registrar_abertura") dados = await fluxo.registrarAbertura({ identidade, transferenciaId: entrada.transferenciaId });
      else {
        const existente = await new RepositorioTransferenciaHumanaDrizzle().buscar(entrada.transferenciaId, identidade);
        if (!existente) throw new Error("TRANSFERENCIA_INDISPONIVEL");
        dados = await fluxo.prepararResumo({
          contemDadosParticulares: false,
          identidade,
          resumo: {
            fatos_verificados: [],
            identificador_seguro_atendimento: `ATD-${existente.id.slice(0, 8).toUpperCase()}`,
            informacoes_declaradas: entrada.informacoesDeclaradas,
            interpretacao_necessidade: entrada.interpretacaoNecessidade,
            motivo: existente.motivo,
            necessidade_principal: entrada.necessidadePrincipal,
            pendencia_validacao_humana: entrada.pendenciaValidacaoHumana,
            produto_ou_pedido_relacionado: entrada.produtoRelacionado,
          },
          transferenciaId: entrada.transferenciaId,
        });
      }
      resposta = Response.json({ dados, sucesso: true });
    }
  } catch {
    resposta = Response.json({ sucesso: false, erro: { codigo: "TRANSFERENCIA_INDISPONIVEL", mensagem: "Não foi possível atualizar o encaminhamento." } }, { status: 400 });
  }
  return aplicarCookieSessaoAtendimento(resposta, requisicao, identidade.identificadorSessao);
}
