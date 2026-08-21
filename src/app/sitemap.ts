import type { MetadataRoute } from "next";

import { listarCategoriasPublicasSitemap } from "@/features/store/category/queries/listar-categorias-publicas-sitemap";
import { listarProdutosPublicosSitemap } from "@/features/store/products/queries/listar-produtos-publicos-sitemap";
import { montarSitemapPublico } from "@/lib/seo/sitemap-publico";

// O catálogo muda pelo admin; o sitemap deve consultar o estado atual do banco.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorias, produtos] = await Promise.all([
    listarCategoriasPublicasSitemap(),
    listarProdutosPublicosSitemap(),
  ]);

  return montarSitemapPublico(categorias, produtos);
}
