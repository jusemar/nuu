"use server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, marcaTable, productTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { listarDiagnosticosLogisticosProdutos } from "@/features/logistica/queries/listar-diagnosticos-logisticos-produtos";

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

        // Dados persistidos usados pelo diagnóstico administrativo.
        weight: productTable.weight,
        height: productTable.height,
        width: productTable.width,
        length: productTable.length,

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

    const diagnosticos = await listarDiagnosticosLogisticosProdutos(
      products.map((produto) => produto.id),
    );
    const diagnosticosPorProdutoId = new Map(
      diagnosticos.map((produto) => [produto.id, produto.diagnostico]),
    );

    return products.map((produto) => ({
      ...produto,
      diagnosticoLogistico: diagnosticosPorProdutoId.get(produto.id) ?? null,
    }));
  } catch (error) {
    console.error("[admin:produtos:listar:erro]", {
      tipo:
        error instanceof Error ? error.constructor.name : "ErroDesconhecido",
    });
    return [];
  }
}
