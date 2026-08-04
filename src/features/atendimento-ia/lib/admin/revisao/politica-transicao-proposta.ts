import type { ESTADOS_PROPOSTA_MELHORIA_ADMIN } from "../../../constants/admin/estados";

type Estado = (typeof ESTADOS_PROPOSTA_MELHORIA_ADMIN)[number];
const TRANSICOES: Record<Estado, readonly Estado[]> = {
  aberta: ["em_triagem", "cancelada"],
  em_triagem: ["aceita", "rejeitada", "cancelada"],
  aceita: ["em_implementacao", "cancelada"],
  em_implementacao: ["aguardando_testes", "cancelada"],
  aguardando_testes: ["concluida", "em_implementacao", "cancelada"],
  concluida: [],
  rejeitada: [],
  cancelada: [],
};
export function validarTransicaoProposta(atual: Estado, proximo: Estado) {
  if (!TRANSICOES[atual].includes(proximo))
    throw new Error("TRANSICAO_PROPOSTA_INVALIDA");
}
