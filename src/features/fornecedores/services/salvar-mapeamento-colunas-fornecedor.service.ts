import { and, eq, inArray } from "drizzle-orm";

import { fornecedorMapeamentosColunasTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { mapeamentoColunasFornecedorSchema } from "../schemas/fornecedores.schema";
import type {
  EntradaSalvarMapeamentoColunasFornecedor,
  ResultadoSalvarMapeamentoColunasFornecedor,
} from "../types/fornecedores.types";

export async function salvarMapeamentoColunasFornecedor(
  entrada: EntradaSalvarMapeamentoColunasFornecedor,
): Promise<ResultadoSalvarMapeamentoColunasFornecedor> {
  const dados = mapeamentoColunasFornecedorSchema.parse(entrada);
  const agora = new Date();
  const campos = dados.mapeamentos.map((item) => item.campoDestino);

  await dbTransacional.transaction(async (tx) => {
    if (campos.length > 0) {
      await tx
        .update(fornecedorMapeamentosColunasTable)
        .set({ ativo: false, atualizadoEm: agora })
        .where(
          and(
            eq(
              fornecedorMapeamentosColunasTable.fornecedorId,
              dados.fornecedorId,
            ),
            eq(fornecedorMapeamentosColunasTable.ativo, true),
            inArray(fornecedorMapeamentosColunasTable.campoDestino, campos),
          ),
        );
    }

    if (dados.mapeamentos.length > 0) {
      await tx.insert(fornecedorMapeamentosColunasTable).values(
        dados.mapeamentos.map((mapeamento) => ({
          fornecedorId: dados.fornecedorId,
          nomeColunaOrigem: mapeamento.nomeColunaOrigem,
          campoDestino: mapeamento.campoDestino,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora,
        })),
      );
    }
  });

  return {
    fornecedorId: dados.fornecedorId,
    totalSalvos: dados.mapeamentos.length,
  };
}
