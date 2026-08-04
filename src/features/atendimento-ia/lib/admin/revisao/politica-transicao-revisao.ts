import type { ESTADOS_REVISAO_ADMIN } from "../../../constants/admin/estados";

type Estado = (typeof ESTADOS_REVISAO_ADMIN)[number];
const TRANSICOES: Record<Estado, readonly Estado[]> = {
  pendente: ["em_analise", "cancelada", "substituida"],
  em_analise: ["aprovada", "reprovada", "cancelada", "substituida"],
  aprovada: ["substituida"],
  reprovada: ["substituida"],
  cancelada: [],
  substituida: [],
};
export function validarTransicaoRevisao(atual: Estado, proximo: Estado) {
  if (!TRANSICOES[atual].includes(proximo))
    throw new Error("TRANSICAO_REVISAO_INVALIDA");
}

export function podeAutorDecidir({
  autorId,
  decisorId,
  outrosDecisoresAtivos,
}: {
  autorId: string;
  decisorId: string;
  outrosDecisoresAtivos: number;
}) {
  return autorId !== decisorId || outrosDecisoresAtivos === 0;
}
