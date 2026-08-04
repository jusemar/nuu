import { LIMITES_LABORATORIO } from "../../../constants/admin/limites-laboratorio";
export function decidirModoExecucao({
  quantidadeCasos,
  tipoComparacao,
}: {
  quantidadeCasos: number;
  tipoComparacao: string;
}) {
  if (quantidadeCasos < 1 || quantidadeCasos > LIMITES_LABORATORIO.maximoCasos)
    throw new Error("QUANTIDADE_CASOS_FORA_LIMITE");
  return quantidadeCasos <= LIMITES_LABORATORIO.maximoCasosSincronos &&
    !["combinado", "lote"].includes(tipoComparacao)
    ? ("sincrono" as const)
    : ("assincrono" as const);
}
