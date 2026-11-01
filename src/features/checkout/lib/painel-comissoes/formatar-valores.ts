/** Formatação no padrão pt-BR, sem converter agregados monetários grandes para float. */
export function formatarCentavosHistoricos(valor: string) {
  const n = BigInt(valor),
    a = n < 0 ? -n : n;
  return `${n < 0 ? "-" : ""}R$ ${new Intl.NumberFormat("pt-BR").format(a / BigInt(100))},${String(a % BigInt(100)).padStart(2, "0")}`;
}
export function formatarDataHistorica(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
export function formatarRegraHistorica(
  tipo: "fixa" | "percentual",
  valor: number,
) {
  return tipo === "fixa"
    ? `${formatarCentavosHistoricos(String(valor))} por unidade`
    : `${String(Math.trunc(valor / 100))}${valor % 100 ? `,${String(valor % 100).padStart(2, "0")}` : ""}% nesta venda`;
}
