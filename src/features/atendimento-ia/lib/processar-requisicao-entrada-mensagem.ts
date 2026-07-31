import {
  ErroEntradaAtendimento,
  receberMensagemAtendimento,
} from "../actions/receber-mensagem-atendimento";
import { LIMITE_BYTES_REQUISICAO_ATENDIMENTO } from "../constants/entrada-mensagem";
import { entradaMensagemAtendimentoSchema } from "../schemas/entrada-mensagem.schema";
import type {
  IdentidadeEntradaAtendimento,
  RepositorioEntradaAtendimento,
} from "../types/entrada-mensagem";

type DependenciasRequisicaoEntrada = {
  atendenteAtivo: boolean;
  identidade: IdentidadeEntradaAtendimento;
  origemPermitida: string;
  repositorio: RepositorioEntradaAtendimento;
};

function respostaErro(status: number, codigo: string, mensagem: string) {
  return Response.json(
    { erro: { codigo, mensagem }, sucesso: false },
    { status },
  );
}

export async function processarRequisicaoEntradaMensagem(
  requisicao: Request,
  dependencias: DependenciasRequisicaoEntrada,
) {
  if (!dependencias.atendenteAtivo) {
    return respostaErro(
      503,
      "ATENDENTE_INDISPONIVEL",
      "O atendimento está indisponível no momento.",
    );
  }

  const origem = requisicao.headers.get("origin");
  if (!origem || origem !== dependencias.origemPermitida) {
    return respostaErro(
      403,
      "ORIGEM_NAO_PERMITIDA",
      "Requisição não permitida.",
    );
  }

  const tipoConteudo = requisicao.headers.get("content-type");
  if (!tipoConteudo?.toLowerCase().startsWith("application/json")) {
    return respostaErro(
      415,
      "FORMATO_NAO_SUPORTADO",
      "O formato da requisição não é suportado.",
    );
  }

  const tamanhoDeclarado = Number(
    requisicao.headers.get("content-length") ?? "0",
  );
  if (
    Number.isFinite(tamanhoDeclarado) &&
    tamanhoDeclarado > LIMITE_BYTES_REQUISICAO_ATENDIMENTO
  ) {
    return respostaErro(
      413,
      "REQUISICAO_MUITO_GRANDE",
      "A requisição excede o limite permitido.",
    );
  }

  let corpoTexto: string;
  try {
    corpoTexto = await requisicao.text();
  } catch {
    return respostaErro(400, "ENTRADA_INVALIDA", "Requisição inválida.");
  }

  if (
    new TextEncoder().encode(corpoTexto).byteLength >
    LIMITE_BYTES_REQUISICAO_ATENDIMENTO
  ) {
    return respostaErro(
      413,
      "REQUISICAO_MUITO_GRANDE",
      "A requisição excede o limite permitido.",
    );
  }

  let corpo: unknown;
  try {
    corpo = JSON.parse(corpoTexto);
  } catch {
    return respostaErro(400, "ENTRADA_INVALIDA", "Requisição inválida.");
  }

  const validacao = entradaMensagemAtendimentoSchema.safeParse(corpo);
  if (!validacao.success) {
    return respostaErro(
      400,
      "ENTRADA_INVALIDA",
      "Os dados enviados são inválidos.",
    );
  }

  try {
    const resultado = await receberMensagemAtendimento(
      dependencias.repositorio,
      validacao.data,
      dependencias.identidade,
    );

    return Response.json({ dados: resultado, sucesso: true }, { status: 202 });
  } catch (erro) {
    if (erro instanceof ErroEntradaAtendimento) {
      if (erro.codigo === "CONVERSA_INDISPONIVEL") {
        return respostaErro(
          404,
          "CONVERSA_INDISPONIVEL",
          "A conversa não está disponível.",
        );
      }
      if (erro.codigo === "IDEMPOTENCIA_CONFLITANTE") {
        return respostaErro(
          409,
          "REQUISICAO_DUPLICADA_DIVERGENTE",
          "A identificação da requisição já foi utilizada.",
        );
      }
    }

    return respostaErro(
      503,
      "PERSISTENCIA_INDISPONIVEL",
      "Não foi possível registrar a mensagem no momento.",
    );
  }
}
