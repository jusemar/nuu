import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutoVinculosTable,
  fornecedorProdutosStagingTable,
  fornecedoresTable,
  importacoesFornecedorTable,
  productTable,
} from "@/db/schema";

import { vincularProdutoFornecedorSchema } from "../schemas/fornecedores.schema";
import type { ResultadoVinculacaoProdutoFornecedor } from "../types/fornecedores.types";

export async function vincularProdutoFornecedor(
  entrada: unknown,
): Promise<ResultadoVinculacaoProdutoFornecedor> {
  const dados = vincularProdutoFornecedorSchema.parse(entrada);

  const [linhaStaging] = await db
    .select({
      id: fornecedorProdutosStagingTable.id,
      codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
      importacaoId: fornecedorProdutosStagingTable.importacaoId,
      fornecedorId: importacoesFornecedorTable.fornecedorId,
    })
    .from(fornecedorProdutosStagingTable)
    .innerJoin(
      importacoesFornecedorTable,
      eq(
        importacoesFornecedorTable.id,
        fornecedorProdutosStagingTable.importacaoId,
      ),
    )
    .where(eq(fornecedorProdutosStagingTable.id, dados.stagingId))
    .limit(1);

  if (!linhaStaging) {
    throw new Error("Item de staging não encontrado.");
  }

  const codigoFornecedor = linhaStaging.codigoFornecedor?.trim();

  if (!codigoFornecedor) {
    throw new Error(
      "Código do fornecedor é obrigatório para vincular produto.",
    );
  }

  const [fornecedor] = await db
    .select({ id: fornecedoresTable.id })
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, linhaStaging.fornecedorId))
    .limit(1);

  if (!fornecedor) {
    throw new Error("Fornecedor não encontrado.");
  }

  const [produto] = await db
    .select({ id: productTable.id })
    .from(productTable)
    .where(eq(productTable.id, dados.produtoId))
    .limit(1);

  if (!produto) {
    throw new Error("Produto não encontrado.");
  }

  const [vinculoAtivoExistente] = await db
    .select({ id: fornecedorProdutoVinculosTable.id })
    .from(fornecedorProdutoVinculosTable)
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedor.id),
        eq(fornecedorProdutoVinculosTable.codigoFornecedor, codigoFornecedor),
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
      ),
    )
    .limit(1);

  if (vinculoAtivoExistente) {
    throw new Error("Já existe vínculo ativo para este código do fornecedor.");
  }

  const [vinculoCriado] = await db
    .insert(fornecedorProdutoVinculosTable)
    .values({
      fornecedorId: fornecedor.id,
      codigoFornecedor,
      produtoId: produto.id,
      tipoVinculo: "manual",
      status: "ativo",
    })
    .returning({ id: fornecedorProdutoVinculosTable.id });

  await db
    .update(fornecedorProdutosStagingTable)
    .set({
      status: "localizado",
      produtoLocalizadoId: produto.id,
      criterioLocalizacao: "vinculo_fornecedor",
      atualizadoEm: new Date(),
    })
    .where(eq(fornecedorProdutosStagingTable.id, linhaStaging.id));

  return {
    vinculoId: vinculoCriado.id,
    stagingId: linhaStaging.id,
    fornecedorId: fornecedor.id,
    codigoFornecedor,
    produtoId: produto.id,
  };
}
