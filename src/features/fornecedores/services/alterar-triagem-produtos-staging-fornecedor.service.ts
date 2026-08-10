import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable } from "@/db/schema";

import { alterarTriagemProdutosStagingFornecedorSchema } from "../schemas/fornecedores.schema";

export async function alterarTriagemProdutosStagingFornecedor(
  entrada: unknown,
) {
  const dados = alterarTriagemProdutosStagingFornecedorSchema.parse(entrada);
  const agora = new Date();

  const linhasAtualizadas = await db
    .update(fornecedorProdutosStagingTable)
    .set(
      dados.acao === "ignorar"
        ? {
            status: "ignorado",
            atualizadoEm: agora,
          }
        : {
            status: sql`
              CASE
                WHEN ${fornecedorProdutosStagingTable.produtoLocalizadoId} IS NOT NULL
                  THEN 'localizado'::fornecedor_produto_staging_status
                WHEN ${fornecedorProdutosStagingTable.criterioLocalizacao} IN ('sem_vinculo_encontrado', 'novo_produto_fornecedor')
                  THEN 'nao_localizado'::fornecedor_produto_staging_status
                ELSE 'aguardando_analise'::fornecedor_produto_staging_status
              END
            `,
            atualizadoEm: agora,
          },
    )
    .where(
      and(
        eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId),
        inArray(fornecedorProdutosStagingTable.id, dados.stagingIds),
      ),
    )
    .returning({ id: fornecedorProdutosStagingTable.id });

  if (linhasAtualizadas.length !== dados.stagingIds.length) {
    throw new Error(
      "Um ou mais itens não pertencem a esta importação ou não foram encontrados.",
    );
  }

  return {
    importacaoId: dados.importacaoId,
    totalAtualizados: linhasAtualizadas.length,
    acao: dados.acao,
  };
}
