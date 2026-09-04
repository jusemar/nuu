import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  productTable,
  produtosTiposLogisticosTable,
  variantesTiposLogisticosTable,
} from "@/db/schema";
import { condicaoProdutoLogisticamenteElegivel } from "@/features/logistica/queries/condicao-produto-logisticamente-elegivel";

/** Produtos publicados e logisticamente elegíveis para oferta na vitrine. */
export async function listarProdutosFonteMerchant() {
  const produtos = await db.query.productTable.findMany({
    where: and(
      eq(productTable.isActive, true),
      eq(productTable.status, "published"),
      condicaoProdutoLogisticamenteElegivel(),
    ),
    orderBy: [asc(productTable.id)],
    with: {
      marca: { columns: { nome: true } },
      pricing: true,
      galleryImages: true,
      identificadoresCatalogo: true,
      variants: {
        with: { identificadoresCatalogo: true },
      },
    },
  });

  if (produtos.length === 0) return [];

  const produtosIds = produtos.map((produto) => produto.id);
  const variantesIds = produtos.flatMap((produto) =>
    produto.variants.map((variante) => variante.id),
  );
  const [vinculosProdutos, vinculosVariantes] = await Promise.all([
    db.query.produtosTiposLogisticosTable.findMany({
      where: inArray(produtosTiposLogisticosTable.produtoId, produtosIds),
      with: { tipoLogistico: true },
    }),
    variantesIds.length > 0
      ? db.query.variantesTiposLogisticosTable.findMany({
          where: inArray(
            variantesTiposLogisticosTable.varianteId,
            variantesIds,
          ),
          with: { tipoLogistico: true },
        })
      : [],
  ]);

  return produtos.map((produto) => ({
    ...produto,
    classificacoesLogisticas: vinculosProdutos.filter(
      (vinculo) => vinculo.produtoId === produto.id,
    ),
    variants: produto.variants.map((variante) => ({
      ...variante,
      classificacoesLogisticas: vinculosVariantes.filter(
        (vinculo) => vinculo.varianteId === variante.id,
      ),
    })),
  }));
}
