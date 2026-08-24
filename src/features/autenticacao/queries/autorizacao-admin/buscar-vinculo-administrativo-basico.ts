import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { administradoresTable } from "@/db/tables/autorizacao-admin";

/** Consulta mínima usada na transição do layout, sem resolver permissões. */
export async function buscarVinculoAdministrativoBasico(usuarioId: string) {
  return db.query.administradoresTable.findFirst({
    columns: { id: true, status: true },
    where: eq(administradoresTable.usuarioId, usuarioId),
  });
}
