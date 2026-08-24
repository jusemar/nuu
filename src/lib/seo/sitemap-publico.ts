import type { MetadataRoute } from "next";

import { montarUrlAbsoluta } from "./url-site";

type RegistroPublicoSitemap = {
  slug: string;
  updatedAt: Date;
};

function slugFormaUrlPublicaValida(slug: string): boolean {
  return slug.trim().length > 0 && !/[/?#]/.test(slug);
}

function montarEntradas(
  caminho: "category" | "product",
  registros: RegistroPublicoSitemap[],
): MetadataRoute.Sitemap {
  return registros.flatMap((registro) => {
    const slug = registro.slug.trim();
    if (!slugFormaUrlPublicaValida(slug)) return [];

    return [
      {
        url: montarUrlAbsoluta(`/${caminho}/${encodeURIComponent(slug)}`),
        lastModified: registro.updatedAt,
      },
    ];
  });
}

function montarEntradasPaginas(
  registros: RegistroPublicoSitemap[],
): MetadataRoute.Sitemap {
  return registros.flatMap((registro) => {
    const slug = registro.slug.trim();
    if (!slugFormaUrlPublicaValida(slug)) return [];
    return [
      {
        url: montarUrlAbsoluta(`/${encodeURIComponent(slug)}`),
        lastModified: registro.updatedAt,
      },
    ];
  });
}

/** Monta somente URLs já aprovadas pelas queries públicas de cada domínio. */
export function montarSitemapPublico(
  categorias: RegistroPublicoSitemap[],
  produtos: RegistroPublicoSitemap[],
  paginas: RegistroPublicoSitemap[] = [],
): MetadataRoute.Sitemap {
  return [
    ...montarEntradas("category", categorias),
    ...montarEntradas("product", produtos),
    ...montarEntradasPaginas(paginas),
  ];
}
