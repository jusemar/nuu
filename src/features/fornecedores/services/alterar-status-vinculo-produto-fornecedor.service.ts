import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutoVinculosTable } from "@/db/schema";

import { alterarStatusVinculoProdutoFornecedorSchema } from "../schemas/fornecedores.schema";
import type { ResultadoSalvarVinculoProdutoFornecedorManual } from "../types/fornecedores.types";

import { salvarVinculoProdutoFornecedorManual } from "./salvar-vinculo-produto-fornecedor-manual.service";

export async function alterarStatusVinculoProdutoFornecedor(
  entrada: unknown,
): Promise<ResultadoSalvarVinculoProdutoFornecedorManual> {
  const dados = alterarStatusVinculoProdutoFornecedorSchema.parse(entrada);

  const [vinculo] = await db
    .select({
      id: fornecedorProdutoVinculosTable.id,
      fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
      produtoId: fornecedorProdutoVinculosTable.produtoId,
      codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
    })
    .from(fornecedorProdutoVinculosTable)
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.id, dados.id),
        eq(fornecedorProdutoVinculosTable.fornecedorId, dados.fornecedorId),
      ),
    )
    .limit(1);

  if (!vinculo) {
    throw new Error("Vínculo não encontrado.");
  }

  return salvarVinculoProdutoFornecedorManual({
    id: vinculo.id,
    fornecedorId: vinculo.fornecedorId,
    produtoId: vinculo.produtoId,
    codigoFornecedor: vinculo.codigoFornecedor,
    status: dados.status,
  });
}
