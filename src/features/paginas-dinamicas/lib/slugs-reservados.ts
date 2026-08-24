/** Primeiros segmentos reais do App Router, além dos arquivos técnicos do Next.js. */
export const SLUGS_RESERVADOS_PAGINAS = new Set([
  "admin",
  "api",
  "atendimento",
  "authentication",
  "cart",
  "category",
  "checkout",
  "completar-cadastro",
  "favicon",
  "google-merchant",
  "minha-conta",
  "my-orders",
  "pre-visualizacao",
  "product",
  "product-variant",
  "robots",
  "sitemap",
  "test",
  "_next",
]);

export function slugPaginaEhReservado(slug: string) {
  return SLUGS_RESERVADOS_PAGINAS.has(slug.trim().toLocaleLowerCase("pt-BR"));
}
