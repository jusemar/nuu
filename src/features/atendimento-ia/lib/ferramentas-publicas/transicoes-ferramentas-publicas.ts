import type { EstadoMensagemAtendimento } from "../../types/entrada-mensagem";

const transicoesPermitidas = new Set([
  "processando:aguardando_ferramenta",
  "aguardando_ferramenta:executando_ferramenta",
  "executando_ferramenta:processando",
]);

export function validarTransicaoFerramentaPublica(
  estadoAtual: EstadoMensagemAtendimento,
  proximoEstado: EstadoMensagemAtendimento,
) {
  if (!transicoesPermitidas.has(`${estadoAtual}:${proximoEstado}`)) {
    throw new Error("TRANSICAO_FERRAMENTA_PUBLICA_INVALIDA");
  }
}
