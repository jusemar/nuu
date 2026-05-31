import "server-only";

import { asc, desc } from "drizzle-orm";

import { db } from "@/db/connection";
import { bannersHomeTable } from "@/db/schema";

export async function listarBannersHomeAdmin() {
  return db
    .select()
    .from(bannersHomeTable)
    .orderBy(
      asc(bannersHomeTable.posicao),
      desc(bannersHomeTable.ativo),
      asc(bannersHomeTable.ordem),
      desc(bannersHomeTable.updatedAt),
    );
}
