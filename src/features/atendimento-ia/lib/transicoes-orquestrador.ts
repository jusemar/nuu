import type { EstadoMensagemAtendimento } from "../types/entrada-mensagem";

const destinosPermitidos: readonly EstadoMensagemAtendimento[] = [
  "aguardando_ferramenta",
  "gerando_resposta",
  "aguardando_atendimento_humano",
  "falhou",
];

export function transicaoOrquestradorPermitida(
  estadoAtual: EstadoMensagemAtendimento,
  proximoEstado: EstadoMensagemAtendimento,
) {
  return (
    estadoAtual === "processando" && destinosPermitidos.includes(proximoEstado)
  );
}

export function validarTransicaoOrquestrador(
  estadoAtual: EstadoMensagemAtendimento,
  proximoEstado: EstadoMensagemAtendimento,
) {
  if (!transicaoOrquestradorPermitida(estadoAtual, proximoEstado)) {
    throw new Error("TRANSICAO_ORQUESTRADOR_INVALIDA");
  }
}
