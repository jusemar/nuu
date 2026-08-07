import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

/**
 * Leitura de entrada de TODAS as etapas: é ela que resolve a importação atual pelo id da URL.
 *
 * Se falhar, nenhuma etapa abre — por isso também precisa da proteção, e não só as queries
 * pesadas. É aqui que o `importacaoId` da rota é preservado: a etapa seguinte sempre usa o
 * mesmo id vindo dos parâmetros, nunca um id recalculado.
 */
export async function listarImportacoesFornecedoresAdmin() {
  return executarLeituraFornecedores(
    {
      etapa: "importacoes:listar-para-admin",
      mensagemAmigavel:
        "Não foi possível carregar as importações agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .select({
          id: importacoesFornecedorTable.id,
          fornecedorId: importacoesFornecedorTable.fornecedorId,
          nomeFornecedor: fornecedoresTable.nome,
          tipoIntegracaoFornecedor: fornecedoresTable.tipoIntegracao,
          tipoArquivo: importacoesFornecedorTable.tipoArquivo,
          status: importacoesFornecedorTable.status,
          nomeArquivo: importacoesFornecedorTable.nomeArquivo,
          totalLinhas: importacoesFornecedorTable.totalLinhas,
          totalProcessadas: importacoesFornecedorTable.totalProcessadas,
          totalErros: importacoesFornecedorTable.totalErros,
          colunasPlanilha: importacoesFornecedorTable.colunasPlanilha,
          mapeamentoColunas: importacoesFornecedorTable.mapeamentoColunas,
          configuracaoFluxoJson:
            importacoesFornecedorTable.configuracaoFluxoJson,
          criadoEm: importacoesFornecedorTable.criadoEm,
          atualizadoEm: importacoesFornecedorTable.atualizadoEm,
        })
        .from(importacoesFornecedorTable)
        .innerJoin(
          fornecedoresTable,
          eq(importacoesFornecedorTable.fornecedorId, fornecedoresTable.id),
        )
        .orderBy(desc(importacoesFornecedorTable.criadoEm)),
  );
}
