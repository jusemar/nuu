import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, productTable } from "@/db/schema";
import { listarProvedoresExpedicaoProdutos } from "@/features/fornecedores/queries/listar-provedores-expedicao-produtos";

import { montarCadeiaCategorias } from "../lib/disponibilidade/resolver-modo-herdado";
import {
  type DisponibilidadeEntregaPropria,
  modoEntregaPropriaDoProduto,
  resolverDisponibilidadeEntregaPropria,
} from "../lib/entrega-propria/resolver-disponibilidade-entrega-propria";

/**
 * Disponibilidade efetiva da Entrega Própria de um produto (sem CEP): decide
 * se a PDP deve oferecer a consulta de Entrega Própria. A existência de preço
 * e agenda para o endereço continua sendo decidida pelo motor na cotação.
 */
export async function buscarDisponibilidadeEntregaPropriaProduto(
  produtoId: string,
): Promise<DisponibilidadeEntregaPropria | null> {
  const [produto, categorias, provedores] = await Promise.all([
    db.query.productTable.findFirst({
      columns: {
        categoryId: true,
        disponibilidadeEntregaPropria: true,
        allowsOwnDelivery: true,
      },
      where: eq(productTable.id, produtoId),
    }),
    db
      .select({
        id: categoryTable.id,
        nome: categoryTable.name,
        parentId: categoryTable.parentId,
        modo: categoryTable.disponibilidadeEntregaPropria,
      })
      .from(categoryTable),
    listarProvedoresExpedicaoProdutos([produtoId]),
  ]);
  if (!produto) return null;

  return resolverDisponibilidadeEntregaPropria({
    modoProduto: modoEntregaPropriaDoProduto({
      modo: produto.disponibilidadeEntregaPropria,
      permiteEntregaPropriaLegado: produto.allowsOwnDelivery,
    }),
    cadeiaCategorias: montarCadeiaCategorias(categorias, produto.categoryId),
    expedidoPorFornecedor: provedores.has(produtoId),
  });
}
