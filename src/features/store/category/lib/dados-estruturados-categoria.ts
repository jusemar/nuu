import { montarUrlAbsoluta } from "@/lib/seo/url-site";

import type { CategoriaBreadcrumb } from "../queries/buscar-categoria-publica";

type ItemBreadcrumbEstruturado = {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
};

export type BreadcrumbListCategoria = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ItemBreadcrumbEstruturado[];
};

/**
 * Converte a mesma trilha usada pelo breadcrumb visual em BreadcrumbList.
 * A query já entrega ancestrais e categoria atual na ordem raiz → folha.
 */
export function montarBreadcrumbListCategoria(
  breadcrumb: CategoriaBreadcrumb[],
): BreadcrumbListCategoria {
  const itens = [
    { name: "Home", url: montarUrlAbsoluta("/") },
    ...breadcrumb.map((categoria) => ({
      name: categoria.name,
      url: montarUrlAbsoluta(`/category/${categoria.slug}`),
    })),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
