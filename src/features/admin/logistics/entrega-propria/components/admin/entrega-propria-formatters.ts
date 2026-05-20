export function formatarFreteEntregaPropria(valorEmCentavos: number): string {
  if (valorEmCentavos === 0) return "Gratis";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

export function montarUrlCidadeEntregaPropria(stateUf: string): string {
  return `/admin/logistics/entrega-propria/cidades?state=${encodeURIComponent(
    stateUf,
  )}`;
}

export function montarUrlRegioesEntregaPropria(
  stateUf: string,
  city: string,
): string {
  return `/admin/logistics/entrega-propria/regioes?state=${encodeURIComponent(
    stateUf,
  )}&city=${encodeURIComponent(city)}`;
}
