export function formatarPontosCliente(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 4,
  }).format(valor);
}

export function formatarDataMovimentoFidelidade(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function formatarCreditoFidelidade(valorEmCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

export function montarPaginasCompactas(pagina: number, totalPaginas: number) {
  const candidatas = new Set([1, totalPaginas, pagina - 1, pagina, pagina + 1]);
  return [...candidatas]
    .filter((item) => item >= 1 && item <= totalPaginas)
    .sort((a, b) => a - b);
}
