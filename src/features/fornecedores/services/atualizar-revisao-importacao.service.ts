import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutosStagingTable,
  marcaTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { correcaoRevisaoImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import type {
  EntradaCorrecaoRevisaoImportacaoFornecedor,
  ResultadoCorrecaoRevisaoImportacaoFornecedor,
} from "../types/fornecedores.types";

export async function atualizarRevisaoImportacaoFornecedor(
  entrada: EntradaCorrecaoRevisaoImportacaoFornecedor,
): Promise<ResultadoCorrecaoRevisaoImportacaoFornecedor> {
  const dados = correcaoRevisaoImportacaoFornecedorSchema.parse(entrada);

  const stagingIdsValidos = await db
    .select({ id: fornecedorProdutosStagingTable.id })
    .from(fornecedorProdutosStagingTable)
    .where(
      and(
        eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId),
        inArray(fornecedorProdutosStagingTable.id, dados.stagingIds),
      ),
    );

  if (stagingIdsValidos.length === 0) {
    throw new Error("Nenhum item de revisão válido foi encontrado.");
  }

  let novoValor: string | null = null;

  if (dados.escopo === "categoria") {
    const [categoria] = await db
      .select({ nome: categoryTable.name })
      .from(categoryTable)
      .where(eq(categoryTable.id, dados.categoriaId ?? ""))
      .limit(1);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    novoValor = categoria.nome;
  }

  if (dados.escopo === "marca") {
    const [marca] = await db
      .select({ nome: marcaTable.nome })
      .from(marcaTable)
      .where(eq(marcaTable.id, dados.marcaId ?? ""))
      .limit(1);

    if (!marca) {
      throw new Error("Marca não encontrada.");
    }

    novoValor = marca.nome;
  }

  if (dados.escopo === "nome") {
    novoValor = dados.nomeProduto?.trim() ?? null;
  }

  if (!novoValor) {
    throw new Error("Valor de revisão inválido.");
  }

  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    await tx
      .update(fornecedorProdutosStagingTable)
      .set({
        ...(dados.escopo === "categoria"
          ? { categoriaFornecedor: novoValor }
          : dados.escopo === "marca"
            ? { marcaFornecedor: novoValor }
            : { nomeProduto: novoValor }),
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId),
          inArray(fornecedorProdutosStagingTable.id, dados.stagingIds),
        ),
      );
  });

  return {
    importacaoId: dados.importacaoId,
    totalAtualizados: stagingIdsValidos.length,
  };
}
