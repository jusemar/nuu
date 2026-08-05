import { config as carregarDotenv } from "dotenv";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/** Endpoint da branch `production`. Ver `docs/ambientes-banco-e-scripts.md`. */
const ENDPOINT_PRODUCAO = "ep-proud-bonus-acy2bafx";

const urlIntegracao = process.env.DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA;
let poolTransacional: Pool | null = null;
type BancoTransacional = NodePgDatabase<typeof schema>;

/**
 * Mesma proteção de `src/db/connection.ts`, e pelo mesmo motivo — este módulo também
 * chegava ao banco por `dotenv` lendo `.env`, que guarda a URL de produção.
 *
 * URL já presente no ambiente veio de uma escolha explícita (Vercel, `npm run dev`, o
 * lançador de scripts locais) e é aceita. URL que só apareceu porque o `dotenv` leu `.env`
 * é o caminho implícito perigoso: apontando para produção, recusa.
 */
function resolverUrlTransacional(): string {
  const urlExplicita = process.env.DATABASE_URL?.trim();

  if (urlExplicita) return urlExplicita;

  carregarDotenv();

  const urlImplicita = process.env.DATABASE_URL?.trim();

  if (!urlImplicita) throw new Error("DATABASE_URL_NAO_CONFIGURADA");

  const endpoint = (new URL(urlImplicita).hostname.split(".")[0] ?? "").replace(
    /-pooler$/,
    "",
  );

  if (endpoint === ENDPOINT_PRODUCAO) {
    throw new Error(
      "DESTINO RECUSADO: o processo caiu no `.env` (produção) sem ninguém escolher o destino. " +
        "Rode scripts locais pelos comandos do package.json. Nenhuma consulta foi executada.",
    );
  }

  return urlImplicita;
}

function criarBancoTransacional(): BancoTransacional {
  const urlBanco = urlIntegracao || resolverUrlTransacional();

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
