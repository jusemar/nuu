import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import { adaptarPrecosVitrine } from "@/features/precificacao/server";

const QUANTIDADE_MINIMA_RELACIONADOS = 2;
const LIMITE_RELACIONADOS = 4;

export type ProdutoRelacionadoPdp = {
  id: string;
  nome: string;
  slug: string;
  imagemUrl: string | null;
  precoEmCentavos: number;
  precoOriginalEmCentavos: number | null;
  percentualOff: number | null;
  produtoVariavel: boolean;
  destaque: boolean;
  freteGratis: boolean;
  ofertaRelampago: boolean;
  melhorPreco: boolean;
};

/**
 * Usa somente catálogo publicado. A prioridade é categoria e, quando não há
 * itens suficientes, marca; não infere compatibilidade comercial inexistente.
 */
export async function buscarProdutosRelacionadosPdp({
  produtoId,
  categoriaId,
  marcaId,
}: {
  produtoId: string;
  categoriaId: string;
  marcaId: string | null;
}): Promise<ProdutoRelacionadoPdp[]> {
  const filtrosBase = [
    eq(productTable.isActive, true),
    eq(productTable.status, "published"),
    ne(productTable.id, produtoId),
  ];
  const porCategoria = await db.query.productTable.findMany({
    where: and(...filtrosBase, eq(productTable.categoryId, categoriaId)),
    limit: LIMITE_RELACIONADOS,
    with: { galleryImages: true, variants: true, pricing: true },
  });

  const idsSelecionados = new Set(porCategoria.map((produto) => produto.id));
  const porMarca =
    porCategoria.length >= QUANTIDADE_MINIMA_RELACIONADOS || !marcaId
      ? []
      : await db.query.productTable.findMany({
          where: and(...filtrosBase, eq(productTable.marcaId, marcaId)),
          limit: LIMITE_RELACIONADOS,
          with: { galleryImages: true, variants: true, pricing: true },
        });
  const produtos = [...porCategoria, ...porMarca]
    .filter(
      (produto) =>
        !idsSelecionados.has(produto.id) || porCategoria.includes(produto),
    )
    .filter(
      (produto, indice, lista) =>
        lista.findIndex((outro) => outro.id === produto.id) === indice,
    )
    .slice(0, LIMITE_RELACIONADOS);

  if (produtos.length < QUANTIDADE_MINIMA_RELACIONADOS) return [];

  const precos = await adaptarPrecosVitrine(produtos);

  return produtos.flatMap((produto) => {
    const preco = precos.produtosPorId[produto.id]?.precoPrincipal;
    if (!preco || preco.precoFinalEmCentavos <= 0) return [];

    const imagem =
      produto.galleryImages.find((imagemAtual) => imagemAtual.isPrimary) ??
      produto.galleryImages[0] ??
      produto.variants.find((variante) => variante.imageUrl)?.imageUrl;

    return [
      {
        id: produto.id,
        nome: produto.name,
        slug: produto.slug,
        imagemUrl:
          typeof imagem === "string" ? imagem : (imagem?.imageUrl ?? null),
        precoEmCentavos: preco.precoFinalEmCentavos,
        precoOriginalEmCentavos: preco.possuiPromocao
          ? preco.precoOriginalEmCentavos
          : null,
        percentualOff: preco.percentualOff,
        produtoVariavel: produto.productKind === "variable",
        destaque: produto.storeProductFlags?.includes("featured") ?? false,
        freteGratis: produto.hasFreeShipping ?? false,
        ofertaRelampago:
          produto.storeProductFlags?.includes("flash_sale") ?? false,
        melhorPreco: produto.storeProductFlags?.includes("best_price") ?? false,
      },
    ];
  });
}
