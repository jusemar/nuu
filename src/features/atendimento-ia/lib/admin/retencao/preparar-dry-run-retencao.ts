import type {
  ItemDryRunRetencao,
  ResultadoDryRunRetencao,
} from "../../../types/admin/metricas";

export function prepararDryRunRetencao(
  itens: ItemDryRunRetencao[],
  agora = new Date(),
): ResultadoDryRunRetencao {
  return {
    executadoEm: agora,
    itens: itens.toSorted((a, b) => a.fonte.localeCompare(b.fonte)),
    modo: "dry_run",
    registrosExcluidos: 0,
  };
}
