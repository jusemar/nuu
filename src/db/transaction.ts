import "dotenv/config";

import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const urlIntegracao = process.env.DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA;
let poolIntegracao: Pool | null = null;
const criarBancoNeon = () => drizzle(process.env.DATABASE_URL!, { schema });
type BancoTransacional = ReturnType<typeof criarBancoNeon>;

function criarBancoTransacional(): BancoTransacional {
  if (!urlIntegracao) {
    return criarBancoNeon();
  }

  const url = new URL(urlIntegracao);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    ![
      "/nuu_integracao_0002",
      "/nuu_integracao_0003_rag",
      "/nuu_integracao_0004_protegidas",
      "/nuu_integracao_0005_transferencia",
      "/nuu_integracao_0006_seguranca",
    ].includes(url.pathname)
  ) {
    throw new Error("BANCO_INTEGRACAO_ATENDIMENTO_IA_NAO_DESCARTAVEL");
  }

  poolIntegracao = new Pool({ connectionString: urlIntegracao });
  return drizzleNodePostgres(poolIntegracao, { schema }) as unknown as BancoTransacional;
}

export const dbTransacional = criarBancoTransacional();

export async function encerrarBancoTransacionalIntegracao() {
  await poolIntegracao?.end();
  poolIntegracao = null;
}
