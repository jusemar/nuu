import "dotenv/config";

import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const urlIntegracao = process.env.DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA;
let poolTransacional: Pool | null = null;
type BancoTransacional = ReturnType<typeof drizzleNodePostgres>;

function criarBancoTransacional(): BancoTransacional {
  const urlBanco = urlIntegracao ?? process.env.DATABASE_URL;

  if (!urlBanco) throw new Error("DATABASE_URL_NAO_CONFIGURADA");

  if (urlIntegracao) {
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
  }

  // O driver HTTP da Neon não suporta transações. Operações atômicas usam pg.
  poolTransacional = new Pool({ connectionString: urlBanco });
  return drizzleNodePostgres(poolTransacional, { schema });
}

export const dbTransacional = criarBancoTransacional();

export async function encerrarBancoTransacionalIntegracao() {
  await poolTransacional?.end();
  poolTransacional = null;
}
