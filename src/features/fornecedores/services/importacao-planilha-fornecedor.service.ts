import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { ResultadoImportacaoFornecedor } from "../types/fornecedores.types";
import { analisarProdutosImportadosFornecedor } from "./analise-produtos-importados.service";
import { lerPlanilhaFornecedor } from "./parser-planilha-fornecedor.service";
import { salvarLinhasStagingFornecedor } from "./staging-fornecedor.service";
import { validarArquivoImportacaoFornecedor } from "./validacao-arquivo-importacao.service";
import { prepararLinhaStagingFornecedor } from "./validacao-linha-importacao.service";

export async function importarPlanilhaFornecedorParaStaging(
  fornecedorId: string,
  arquivo: File,
): Promise<ResultadoImportacaoFornecedor> {
  const arquivoValidado = validarArquivoImportacaoFornecedor(arquivo);

  const [fornecedor] = await db
    .select({ id: fornecedoresTable.id })
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, fornecedorId))
    .limit(1);

  if (!fornecedor) {
    throw new Error("Fornecedor não encontrado para importação.");
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const resultadoParser = lerPlanilhaFornecedor(buffer);
  const linhasStaging = resultadoParser.linhas.map(
    prepararLinhaStagingFornecedor,
  );
  const totalErros = linhasStaging.filter(
    (linha) => linha.status === "erro",
  ).length;
  const totalValido = linhasStaging.length - totalErros;
  const agora = new Date();

  const [importacao] = await dbTransacional.transaction(async (tx) => {
    const [registroImportacao] = await tx
      .insert(importacoesFornecedorTable)
      .values({
        fornecedorId,
        tipoArquivo: "arquivo_excel",
        status: "em_staging",
        nomeArquivo: arquivoValidado.nome,
        totalLinhas: linhasStaging.length,
        totalProcessadas: totalValido,
        totalErros,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .returning({ id: importacoesFornecedorTable.id });

    await salvarLinhasStagingFornecedor(
      tx,
      registroImportacao.id,
      linhasStaging,
    );

    return [registroImportacao];
  });

  const resultadoAnalise = await analisarProdutosImportadosFornecedor(
    importacao.id,
  );

  return {
    importacaoId: importacao.id,
    totalImportado: linhasStaging.length,
    totalValido,
    totalErros,
    totalEncontrados: resultadoAnalise.totalEncontrados,
    totalNaoEncontrados: resultadoAnalise.totalNaoEncontrados,
  };
}
