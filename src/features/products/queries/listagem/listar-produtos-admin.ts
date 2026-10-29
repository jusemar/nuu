import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, marcaTable, productTable } from "@/db/schema";
import { listarDiagnosticosLogisticosProdutos } from "@/features/logistica/queries/listar-diagnosticos-logisticos-produtos";

import { filtrosProdutosAdminSchema } from "../../schemas/listagem/filtros-produtos-admin.schema";
import {
  condicaoProdutoAdministrativo,
  exigirLeituraProdutosAdmin,
} from "../autorizacao/escopo-produtos-admin";

export async function listarProdutosAdmin(
  entrada: unknown = {},
  paginada = true,
) {
  const contexto = await exigirLeituraProdutosAdmin();
  const filtros = filtrosProdutosAdminSchema.parse(entrada);
  const representante = Boolean(
    contexto.representanteFornecedor && !contexto.administradorPrincipal,
  );
  const condicao = and(
    condicaoProdutoAdministrativo(contexto),
    filtros.busca
      ? or(
          ilike(productTable.name, `%${filtros.busca}%`),
          ilike(productTable.sku, `%${filtros.busca}%`),
          ilike(productTable.slug, `%${filtros.busca}%`),
          ilike(productTable.productCode, `%${filtros.busca}%`),
          ilike(productTable.internalCode, `%${filtros.busca}%`),
          ilike(marcaTable.nome, `%${filtros.busca}%`),
        )
      : undefined,
    filtros.categoriaId
      ? eq(productTable.categoryId, filtros.categoriaId)
      : undefined,
    filtros.marcaId ? eq(productTable.marcaId, filtros.marcaId) : undefined,
    filtros.status ? eq(productTable.status, filtros.status) : undefined,
    filtros.ativo !== undefined
      ? eq(productTable.isActive, filtros.ativo)
      : undefined,
  );
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
    .where(condicao)
    .orderBy(desc(productTable.updatedAt), productTable.id)
    .limit(paginada || representante ? filtros.porPagina : 2147483647)
    .offset(
      paginada || representante ? (filtros.pagina - 1) * filtros.porPagina : 0,
    );
  const [contagem] = await db
    .select({ total: count() })
    .from(productTable)
    .leftJoin(marcaTable, eq(productTable.marcaId, marcaTable.id))
    .where(condicao);

  const diagnosticos = representante
    ? []
    : await listarDiagnosticosLogisticosProdutos(
        products.map((produto) => produto.id),
      );
  const diagnosticosPorProdutoId = new Map(
    diagnosticos.map((produto) => [produto.id, produto.diagnostico]),
  );

  const produtos = products.map((produto) => ({
    ...produto,
    diagnosticoLogistico: diagnosticosPorProdutoId.get(produto.id) ?? null,
  }));
  return {
    produtos,
    total: contagem.total,
    pagina: filtros.pagina,
    porPagina: filtros.porPagina,
  };
}
