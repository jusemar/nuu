import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutoVinculosTable,
  fornecedoresTable,
  productTable,
} from "@/db/schema";

import {
  desfazerVinculoProdutoRecebidoFornecedorSchema,
  salvarVinculoProdutoRecebidoFornecedorSchema,
} from "../schemas/fornecedores.schema";

export async function salvarVinculoProdutoRecebidoFornecedor(entrada: unknown) {
  const dados = salvarVinculoProdutoRecebidoFornecedorSchema.parse(entrada);

  const [fornecedor] = await db
    .select({ id: fornecedoresTable.id })
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, dados.fornecedorId))
    .limit(1);

  if (!fornecedor) throw new Error("Fornecedor não encontrado.");

  const [produto] = await db
    .select({
      id: productTable.id,
      nome: productTable.name,
      sku: productTable.sku,
      precoCentavos: sql<number | null>`(
        select preco.price_in_cents
        from product_pricing preco
        where preco.product_id = ${productTable.id}
          and preco.is_active = true
        order by preco.main_card_price desc nulls last, preco.created_at asc
        limit 1
      )`,
    })
    .from(productTable)
    .where(eq(productTable.id, dados.produtoId))
    .limit(1);

  if (!produto) throw new Error("Produto da loja não encontrado.");

  const [vinculoExistente] = await db
    .select({ id: fornecedorProdutoVinculosTable.id })
    .from(fornecedorProdutoVinculosTable)
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedor.id),
        eq(
          fornecedorProdutoVinculosTable.codigoFornecedor,
          dados.codigoFornecedor,
        ),
      ),
    )
    .limit(1);

  const agora = new Date();
  const [vinculo] = vinculoExistente
    ? await db
        .update(fornecedorProdutoVinculosTable)
        .set({
          produtoId: produto.id,
          tipoVinculo: "manual",
          status: "ativo",
          atualizadoEm: agora,
        })
        .where(eq(fornecedorProdutoVinculosTable.id, vinculoExistente.id))
        .returning({ id: fornecedorProdutoVinculosTable.id })
    : await db
        .insert(fornecedorProdutoVinculosTable)
        .values({
          fornecedorId: fornecedor.id,
          codigoFornecedor: dados.codigoFornecedor,
          produtoId: produto.id,
          tipoVinculo: "manual",
          status: "ativo",
          criadoEm: agora,
          atualizadoEm: agora,
        })
        .returning({ id: fornecedorProdutoVinculosTable.id });

  return {
    vinculoId: vinculo.id,
    produto: {
      id: produto.id,
      nome: produto.nome,
      sku: produto.sku,
      categoria: null,
      preco:
        typeof produto.precoCentavos === "number"
          ? (produto.precoCentavos / 100).toFixed(2)
          : null,
    },
  };
}

export async function desfazerVinculoProdutoRecebidoFornecedor(
  entrada: unknown,
) {
  const dados = desfazerVinculoProdutoRecebidoFornecedorSchema.parse(entrada);

  const [vinculo] = await db
    .update(fornecedorProdutoVinculosTable)
    .set({ status: "inativo", atualizadoEm: new Date() })
    .where(eq(fornecedorProdutoVinculosTable.id, dados.vinculoId))
    .returning({ id: fornecedorProdutoVinculosTable.id });

  if (!vinculo) throw new Error("Vínculo não encontrado.");

  return vinculo;
}
