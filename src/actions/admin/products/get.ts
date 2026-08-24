"use server";

import { desc,eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, marcaTable,productTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function getProducts() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR);
  try {
    const products = await db
      .select({
        // Campos básicos
        id: productTable.id,
        name: productTable.name,
        slug: productTable.slug,
        description: productTable.description,
        brand: marcaTable.nome,

        // Códigos
        sku: productTable.sku,

        // Flags da loja
        storeProductFlags: productTable.storeProductFlags,

        // Status
        status: productTable.status,
        isActive: productTable.isActive,

        // Preços
        costPrice: productTable.costPrice,
        salePrice: productTable.salePrice,
        promoPrice: productTable.promoPrice,

        // Categoria
        categoryId: productTable.categoryId,
        categoryName: categoryTable.name,

        // Timestamps
        createdAt: productTable.createdAt,
        updatedAt: productTable.updatedAt,
      })
      .from(productTable)
      .leftJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
      .leftJoin(marcaTable, eq(productTable.marcaId, marcaTable.id))
      .orderBy(desc(productTable.updatedAt));

    return products;
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}
