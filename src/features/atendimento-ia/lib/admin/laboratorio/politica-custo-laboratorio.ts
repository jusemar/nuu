import { LIMITES_LABORATORIO } from "../../../constants/admin/limites-laboratorio";
export function estimarCustoLaboratorio(
  tokensEntrada: number,
  tokensSaida: number,
) {
  const custo = tokensEntrada * 0.000001 + tokensSaida * 0.000004;
  if (tokensEntrada + tokensSaida > LIMITES_LABORATORIO.maximoTokensExecucao)
    throw new Error("LIMITE_TOKENS_LABORATORIO");
  if (custo > LIMITES_LABORATORIO.maximoCustoEstimadoUsd)
    throw new Error("LIMITE_CUSTO_LABORATORIO");
  return Number(custo.toFixed(6));
}
