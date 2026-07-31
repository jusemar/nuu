import type { EstadoMensagemAtendimento } from "../types/entrada-mensagem";

const transicoesEntradaMensagem: Partial<
  Record<EstadoMensagemAtendimento, readonly EstadoMensagemAtendimento[]>
> = {
  recebida: ["validando"],
  validando: ["processando", "falhou"],
};

export function transicaoEntradaMensagemPermitida(
  estadoAtual: EstadoMensagemAtendimento,
  proximoEstado: EstadoMensagemAtendimento,
) {
  return (
    transicoesEntradaMensagem[estadoAtual]?.includes(proximoEstado) ?? false
  );
}

export function validarTransicaoEntradaMensagem(
  estadoAtual: EstadoMensagemAtendimento,
  proximoEstado: EstadoMensagemAtendimento,
) {
  if (!transicaoEntradaMensagemPermitida(estadoAtual, proximoEstado)) {
    throw new Error("TRANSICAO_ESTADO_MENSAGEM_INVALIDA");
  }
}
