import { and, eq, inArray, isNull, notInArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable } from "@/db/schema";

import { tratarProdutosFornecedorComoNovosSchema } from "../schemas/fornecedores.schema";

export async function tratarProdutosFornecedorComoNovos(entrada: unknown) {
  const dados = tratarProdutosFornecedorComoNovosSchema.parse(entrada);

  const linhasAtualizadas = await db
    .update(fornecedorProdutosStagingTable)
    .set({
      status: "nao_localizado",
      produtoLocalizadoId: null,
      criterioLocalizacao: "novo_produto_fornecedor",
      atualizadoEm: new Date(),
    })
    .where(
      and(
        eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId),
        inArray(fornecedorProdutosStagingTable.id, dados.stagingIds),
        isNull(fornecedorProdutosStagingTable.produtoLocalizadoId),
        notInArray(fornecedorProdutosStagingTable.status, [
          "erro",
          "rejeitado",
        ]),
      ),
    )
    .returning({ id: fornecedorProdutosStagingTable.id });

  return {
    importacaoId: dados.importacaoId,
    totalAtualizados: linhasAtualizadas.length,
  };
}
