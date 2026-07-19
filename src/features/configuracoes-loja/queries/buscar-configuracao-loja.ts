import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { configuracoesLojaTable } from "@/db/schema";

const ID_CONFIGURACAO_GLOBAL = "global";

export async function buscarConfiguracaoLoja() {
  const [configuracao] = await db
    .select({ nomeComercial: configuracoesLojaTable.nomeComercial })
    .from(configuracoesLojaTable)
    .where(eq(configuracoesLojaTable.id, ID_CONFIGURACAO_GLOBAL))
    .limit(1);

  return {
    nomeComercial: configuracao?.nomeComercial?.trim() || null,
  };
}
