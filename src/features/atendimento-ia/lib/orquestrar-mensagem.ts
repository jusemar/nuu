import type { IdentidadeEntradaAtendimento } from "../types/entrada-mensagem";
import {
  type ComponenteProcessamentoOrquestrado,
  FalhaComponenteOrquestrado,
  type RepositorioOrquestrador,
  type ResultadoOrquestracao,
} from "../types/orquestrador";
import { validarTransicaoOrquestrador } from "./transicoes-orquestrador";

function mapearProximoEstado(
  tipo:
    | "aguardar_ferramenta"
    | "encaminhar_geracao_resposta"
    | "aguardar_atendimento_humano",
) {
  if (tipo === "aguardar_ferramenta") return "aguardando_ferramenta" as const;
  if (tipo === "aguardar_atendimento_humano") {
    return "aguardando_atendimento_humano" as const;
  }
  return "gerando_resposta" as const;
}

export async function orquestrarMensagem(
  dependencias: {
    componente: ComponenteProcessamentoOrquestrado;
    contextoExpiraAposDias?: (identidade: IdentidadeEntradaAtendimento) => number;
    manterContexto?: (dados: {
      contexto: Parameters<ComponenteProcessamentoOrquestrado["processar"]>[0]["contexto"];
      execucaoId: string;
    }) => Promise<Parameters<ComponenteProcessamentoOrquestrado["processar"]>[0]["contexto"]>;
    memoriaAtiva: boolean;
    memoriaExpiraAposDias?: number;
    recuperarFontesInstitucionais?: (dados: {
      execucaoId: string;
      pergunta: string;
    }) => Promise<
      NonNullable<
        Parameters<ComponenteProcessamentoOrquestrado["processar"]>[0]["contexto"]["fontesInstitucionais"]
      >
    >;
    repositorio: RepositorioOrquestrador;
  },
  dados: {
    identidade: IdentidadeEntradaAtendimento;
    mensagemId: string;
  },
): Promise<ResultadoOrquestracao> {
  const reivindicacao = await dependencias.repositorio.reivindicarProcessamento(
    {
      contextoExpiraAposDias: dependencias.contextoExpiraAposDias?.(
        dados.identidade,
      ),
      identidade: dados.identidade,
      memoriaAtiva: dependencias.memoriaAtiva,
      memoriaExpiraAposDias: dependencias.memoriaExpiraAposDias,
      mensagemId: dados.mensagemId,
    },
  );

  if (reivindicacao.tipo !== "adquirida") return reivindicacao;

  try {
    let contexto = dependencias.manterContexto
      ? await dependencias.manterContexto({
          contexto: reivindicacao.contexto,
          execucaoId: reivindicacao.execucaoId,
        })
      : reivindicacao.contexto;
    if (dependencias.recuperarFontesInstitucionais) {
      const fontesInstitucionais =
        await dependencias.recuperarFontesInstitucionais({
          execucaoId: reivindicacao.execucaoId,
          pergunta: contexto.mensagemAtual.conteudo,
        });
      contexto = { ...contexto, fontesInstitucionais };
      if (fontesInstitucionais.status === "conflito") {
        throw new FalhaComponenteOrquestrado("definitiva", "conflito_fontes");
      }
    }
    const resultado = await dependencias.componente.processar({
      contexto,
      execucaoId: reivindicacao.execucaoId,
    });
    const proximoEstado = mapearProximoEstado(resultado.tipo);
    validarTransicaoOrquestrador("processando", proximoEstado);

    const conclusao = await dependencias.repositorio.concluirEncaminhamento({
      execucaoId: reivindicacao.execucaoId,
      mensagemId: dados.mensagemId,
      proximoEstado,
      resultado,
    });

    if (proximoEstado === "aguardando_atendimento_humano") {
      if (!conclusao.transferenciaId) {
        throw new FalhaComponenteOrquestrado("definitiva", "erro_interno");
      }
      return {
        execucaoId: reivindicacao.execucaoId,
        estado: proximoEstado,
        requestId: resultado.metadados.requestId ?? null,
        transferenciaId: conclusao.transferenciaId,
        tipo: "aguardando_atendimento_humano",
      };
    }

    return {
      execucaoId: reivindicacao.execucaoId,
      estado: proximoEstado,
      mensagemRespostaId: conclusao.mensagemRespostaId,
      requestId: resultado.metadados.requestId ?? null,
      tipo: "encaminhada",
    };
  } catch (erro) {
    const falha =
      erro instanceof FalhaComponenteOrquestrado
        ? erro
        : new FalhaComponenteOrquestrado("definitiva", "erro_interno");

    if (falha.classificacao === "definitiva") {
      validarTransicaoOrquestrador("processando", "falhou");
    }

    await dependencias.repositorio.registrarFalha({
      classificacao: falha.classificacao,
      execucaoId: reivindicacao.execucaoId,
      mensagemId: dados.mensagemId,
      tipo: falha.tipo,
    });

    if (falha.classificacao === "definitiva") {
      return {
        execucaoId: reivindicacao.execucaoId,
        estado: "falhou",
        tipo: "falha_definitiva",
      };
    }

    return {
      execucaoId: reivindicacao.execucaoId,
      estado: "processando",
      tipo: "falha_recuperavel",
    };
  }
}
