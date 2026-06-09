import "server-only";

import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import {
  productGalleryImagesTable,
  productPricingTable,
  productTable,
} from "../../../db/schema";
import { buscarProdutosPromocaoAdminSchema } from "../schemas";
import type { ProdutoPromocaoAdmin } from "../types";

export async function buscarProdutosPromocaoAdmin(
  entrada: unknown,
): Promise<ProdutoPromocaoAdmin[]> {
  const filtros = buscarProdutosPromocaoAdminSchema.parse(entrada);

  const linhas = await db
    .select({
      id: productTable.id,
      nome: productTable.name,
      slug: productTable.slug,
      sku: productTable.sku,
      imagemUrl: productGalleryImagesTable.imageUrl,
      precoAtualEmCentavos: productPricingTable.price,
      modalidade: productPricingTable.type,
    })
    .from(productTable)
    .leftJoin(
      productGalleryImagesTable,
      eq(productGalleryImagesTable.productId, productTable.id),
    )
    .leftJoin(
      productPricingTable,
      eq(productPricingTable.productId, productTable.id),
    )
    .where(
      and(
        eq(productTable.isActive, true),
        or(
          ilike(productTable.name, `%${filtros.busca}%`),
          ilike(productTable.sku, `%${filtros.busca}%`),
          ilike(productTable.slug, `%${filtros.busca}%`),
        ),
      ),
    )
    .limit(filtros.limite * 3);

  const produtosIncluidos = new Set<string>();
  const produtos: ProdutoPromocaoAdmin[] = [];
  const modalidadesPorProduto = new Map<string, Set<string>>();

  linhas.forEach((linha) => {
    const modalidades = modalidadesPorProduto.get(linha.id) ?? new Set();
    if (linha.modalidade) {
      modalidades.add(linha.modalidade);
    }
    modalidadesPorProduto.set(linha.id, modalidades);
  });

  for (const linha of linhas) {
    if (produtosIncluidos.has(linha.id)) {
      continue;
    }

    produtosIncluidos.add(linha.id);
    produtos.push({
      id: linha.id,
      nome: linha.nome,
      slug: linha.slug,
      sku: linha.sku,
      imagemUrl: linha.imagemUrl,
      precoAtualEmCentavos: linha.precoAtualEmCentavos,
      modalidade: null,
      modalidadesDisponiveis: [
        ...(modalidadesPorProduto.get(linha.id) ?? new Set<string>()),
      ],
    });

    if (produtos.length >= filtros.limite) {
      break;
    }
  }

  return produtos;
}
