import { inArray, type SQL, sql } from "drizzle-orm";

import { produtoRascunhosTable } from "@/db/schema";

/**
 * Importação dona do rascunho, lida de dentro do JSON de origem.
 *
 * `produto_rascunhos` não tem coluna de importação: as duas origens (arquivo e
 * API) gravam a execução em `dados_origem_json.origemFluxoFornecedor`. Esta é a
 * expressão canônica dessa leitura.
 */
export function chaveImportacaoRascunhoFornecedor(): SQL<string> {
  return sql<string>`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId'`;
}

/**
 * Condição "o rascunho pertence a uma destas execuções".
 *
 * Existe como função própria por causa de um bug real: a primeira versão
 * escreveu `= ANY(${importacaoIds})` dentro de um template `sql`. Interpolar um
 * array ali NÃO produz um array em SQL — o Drizzle expande a lista em
 * parâmetros separados, e o Postgres recusava dos dois jeitos:
 *
 *   1 id   → `ANY(($1))`            → 22P02, malformed array literal
 *   N ids  → `ANY(($1, $2, $3))`    → 42809, op ANY/ALL (array) requires array
 *
 * `inArray` gera `in ($1, $2, …)`, que é válido, continua parametrizado (os ids
 * nunca são interpolados no texto) e não muda de forma com a quantidade. Lista
 * vazia vira `false` no Drizzle, então a consulta simplesmente não casa nada em
 * vez de estourar.
 */
export function filtrarRascunhosPorImportacoesFornecedor(
  importacaoIds: string[],
): SQL {
  return inArray(chaveImportacaoRascunhoFornecedor(), importacaoIds);
}
