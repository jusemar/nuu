import { CHAVE_HANDOFF_ATENDIMENTO } from "../constants/atendimento-storage";
import {
  type HandoffAtendimento,
  handoffAtendimentoSchema,
} from "../schemas/mensagem-atendente.schema";

export function salvarHandoffAtendimento(handoff: HandoffAtendimento) {
  const handoffValidado = handoffAtendimentoSchema.parse(handoff);

  window.sessionStorage.setItem(
    CHAVE_HANDOFF_ATENDIMENTO,
    JSON.stringify(handoffValidado),
  );
}

export function consumirHandoffAtendimento(): HandoffAtendimento | null {
  const conteudoSalvo = window.sessionStorage.getItem(
    CHAVE_HANDOFF_ATENDIMENTO,
  );

  // O conteúdo é removido antes da leitura para garantir consumo único,
  // inclusive quando um valor antigo ou inválido estiver armazenado.
  window.sessionStorage.removeItem(CHAVE_HANDOFF_ATENDIMENTO);

  if (!conteudoSalvo) return null;

  try {
    const resultado = handoffAtendimentoSchema.safeParse(
      JSON.parse(conteudoSalvo),
    );

    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}
