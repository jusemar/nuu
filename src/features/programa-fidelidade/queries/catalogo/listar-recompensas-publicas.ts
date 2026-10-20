import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";

import { productTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { condicaoProdutoLogisticamenteElegivel } from "@/features/logistica/queries/condicao-produto-logisticamente-elegivel";

const TAMANHO_PAGINA = 12;

// A recompensa usa o catálogo existente; estes filtros são os mesmos gates públicos
// de publicação, acrescidos da marcação e do custo configurados no produto.
const condicaoRecompensaPublica = and(
  eq(productTable.status, "published"),
  eq(productTable.isActive, true),
  eq(productTable.recompensaPontosAtiva, true),
  gt(productTable.recompensaCustoPontos, 0),
  condicaoProdutoLogisticamenteElegivel(),
  sql`exists (select 1 from product_pricing preco where preco.product_id = ${productTable.id} and preco.is_active = true and preco.price_in_cents > 0)`,
  sql`exists (select 1 from product_variant variante where variante.product_id = ${productTable.id} and variante.is_active = true and variante.price_in_cents > 0)`,
);

export type RecompensaPublica = {
  id: string;
  slug: string;
  nome: string;
  imagemUrl: string | null;
  custoPontos: number;
};

function mapearRecompensa(produto: {
  id: string;
  slug: string;
  name: string;
  recompensaCustoPontos: number | null;
  galleryImages: Array<{ imageUrl: string; isPrimary: boolean | null }>;
}): RecompensaPublica {
  const imagem = produto.galleryImages.find((atual) => atual.isPrimary) ?? produto.galleryImages[0];
  return {
    id: produto.id,
    slug: produto.slug,
    nome: produto.name,
    imagemUrl: imagem?.imageUrl ?? null,
    custoPontos: produto.recompensaCustoPontos!,
  };
}

export async function listarRecompensasPublicas(pagina = 1) {
  const paginaSegura = Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
  const produtos = await dbTransacional.query.productTable.findMany({
    where: condicaoRecompensaPublica,
    orderBy: [desc(productTable.createdAt), desc(productTable.id)],
    limit: TAMANHO_PAGINA + 1,
    offset: (paginaSegura - 1) * TAMANHO_PAGINA,
    with: { galleryImages: true },
  });
  return {
    recompensas: produtos.slice(0, TAMANHO_PAGINA).map(mapearRecompensa),
    pagina: paginaSegura,
    proximaPagina: produtos.length > TAMANHO_PAGINA ? paginaSegura + 1 : null,
  };
}

export async function buscarRecompensaPublicaPorSlug(slug: string) {
  const produto = await dbTransacional.query.productTable.findFirst({
    where: and(condicaoRecompensaPublica, eq(productTable.slug, slug)),
    with: { galleryImages: true, pricing: true, variants: true },
  });
  if (!produto) return null;
  const precoPrincipal = produto.pricing.find((preco) => preco.isActive && preco.mainCardPrice && preco.price > 0) ??
    produto.pricing.find((preco) => preco.isActive && preco.price > 0);
  const variantes = produto.variants.filter((variante) => variante.isActive && variante.priceInCents > 0);
  if (!precoPrincipal || variantes.length === 0) return null;
  return {
    ...mapearRecompensa(produto),
    produtoVariavel: produto.productKind === "variable",
    modalidadeTipo: precoPrincipal.type,
    precoInternoEmCentavos: precoPrincipal.hasPromo && precoPrincipal.promoPrice
      ? precoPrincipal.promoPrice : precoPrincipal.price,
    sku: produto.sku,
    variantes: variantes.map((variante) => ({
      id: variante.id,
      nome: variante.name || Object.values(variante.attributes).join(" / ") || "Variante",
      sku: variante.sku,
      imagemUrl: variante.imageUrl,
      precoInternoEmCentavos: variante.priceInCents,
      estoqueDisponivel: variante.stockQuantity,
    })),
  };
}
