import { sql, type SQLWrapper } from "drizzle-orm";

/**
 * Compara a versão otimista na precisão que atravessa o contrato JavaScript.
 *
 * O PostgreSQL preserva microssegundos em `timestamp`, enquanto `Date` e JSON
 * transportam apenas milissegundos. Truncar somente durante a comparação evita
 * rejeitar um registro inalterado sem remover a proteção contra concorrência.
 */
export function compararTimestampSerializado(
  coluna: SQLWrapper,
  esperado: Date,
) {
  return sql`date_trunc('milliseconds', ${coluna}) = ${esperado}::timestamp`;
}
