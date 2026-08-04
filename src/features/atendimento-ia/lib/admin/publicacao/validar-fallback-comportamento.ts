import { INSTRUCOES_SISTEMA_ATENDENTE_IA } from "../../../constants/instrucoes-openai";

export function validarFallbackComportamento() {
  if (INSTRUCOES_SISTEMA_ATENDENTE_IA.trim().length < 100)
    throw new Error("FALLBACK_COMPORTAMENTO_INVALIDO");
  return INSTRUCOES_SISTEMA_ATENDENTE_IA;
}
