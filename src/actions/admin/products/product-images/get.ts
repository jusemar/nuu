"use server";

import { and, asc,eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { productImageTable } from "@/db/schema";
import { productVariantTable } from "@/db/schema";
import {
  condicaoProdutoAdministrativo,
  exigirLeituraVarianteAdmin,
} from "@/features/products/queries/autorizacao/escopo-produtos-admin";

export async function getProductImages(variantId: string) {
  const { contexto } = await exigirLeituraVarianteAdmin(variantId);
  return db
    .select({
      id: productImageTable.id,
      productVariantId: productImageTable.productVariantId,
      imageUrl: productImageTable.imageUrl,
      externalImageId: productImageTable.externalImageId,
      altText: productImageTable.altText,
      sortOrder: productImageTable.sortOrder,
      createdAt: productImageTable.createdAt,
    })
    .from(productImageTable)
    .innerJoin(
      productVariantTable,
      eq(productVariantTable.id, productImageTable.productVariantId),
    )
    .where(
      and(
        eq(productImageTable.productVariantId, variantId),
        condicaoProdutoAdministrativo(contexto, productVariantTable.productId),
      ),
    )
    .orderBy(asc(productImageTable.sortOrder));
}
