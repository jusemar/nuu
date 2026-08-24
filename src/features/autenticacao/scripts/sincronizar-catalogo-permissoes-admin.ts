import { db } from "@/db/connection";
import { permissoesAdministrativasTable } from "@/db/tables/autorizacao-admin";
import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

/**
 * Sincronização explícita e idempotente: insere chaves novas, preserva IDs e
 * status existentes e atualiza apenas metadados de apresentação conhecidos.
 */
export const execucao = db
  .insert(permissoesAdministrativasTable)
  .values(CATALOGO_PERMISSOES_ADMIN.map((permissao) => ({ ...permissao })))
  .onConflictDoUpdate({
    target: permissoesAdministrativasTable.chave,
    set: {
      descricao: sql`excluded.descricao`,
      modulo: sql`excluded.modulo`,
      nome: sql`excluded.nome`,
      updatedAt: new Date(),
    },
    setWhere: sql`
      ${permissoesAdministrativasTable.nome} IS DISTINCT FROM excluded.nome
      OR ${permissoesAdministrativasTable.descricao} IS DISTINCT FROM excluded.descricao
      OR ${permissoesAdministrativasTable.modulo} IS DISTINCT FROM excluded.modulo
    `,
  })
  .returning({ chave: permissoesAdministrativasTable.chave })
  .then((registros) => {
    console.log(
      `[rbac-global] Catálogo sincronizado: ${CATALOGO_PERMISSOES_ADMIN.length} conhecidas; ${registros.length} inseridas ou atualizadas.`,
    );
  });
import { sql } from "drizzle-orm";
