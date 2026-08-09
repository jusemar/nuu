import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

export type ImportacaoFornecedorAdmin = {
  id: string;
  fornecedorId: string;
  nomeFornecedor: string;
  tipoArquivo: "arquivo_excel" | "api";
  status: string;
  nomeArquivo: string | null;
  configuracaoFluxoJson: Record<string, unknown>;
  criadoEm: Date;
};

/**
 * UMA importação, pelo id da rota.
 *
 * As telas resolviam a importação atual chamando
 * `listarImportacoesFornecedoresAdmin()` — que lê a tabela inteira, com join de
 * fornecedores e três colunas JSONB pesadas, sem `limit` — só para rodar um
 * `.find()` em memória. Numa loja com histórico, esse é um custo que cresce a
 * cada importação feita, para devolver sempre uma linha.
 */
export async function buscarImportacaoFornecedorAdmin(
  importacaoId: string,
): Promise<ImportacaoFornecedorAdmin | null> {
  const [importacao] = await executarLeituraFornecedores(
    {
      etapa: "importacoes:buscar-por-id",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível carregar esta importação agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .select({
          id: importacoesFornecedorTable.id,
          fornecedorId: importacoesFornecedorTable.fornecedorId,
          nomeFornecedor: fornecedoresTable.nome,
          tipoArquivo: importacoesFornecedorTable.tipoArquivo,
          status: importacoesFornecedorTable.status,
          nomeArquivo: importacoesFornecedorTable.nomeArquivo,
          configuracaoFluxoJson:
            importacoesFornecedorTable.configuracaoFluxoJson,
          criadoEm: importacoesFornecedorTable.criadoEm,
        })
        .from(importacoesFornecedorTable)
        .innerJoin(
          fornecedoresTable,
          eq(importacoesFornecedorTable.fornecedorId, fornecedoresTable.id),
        )
        .where(eq(importacoesFornecedorTable.id, importacaoId))
        .limit(1),
  );

  return importacao ?? null;
}
