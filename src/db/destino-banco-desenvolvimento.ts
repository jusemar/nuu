/**
 * Regras do destino do banco no servidor de desenvolvimento (`next dev`).
 *
 * - `npm run dev`      → sempre o PostgreSQL local (loopback).
 * - `npm run dev:neon` → Neon, e somente porque o lançador marca o processo
 *   com NOOO_BANCO_NEON_EXPLICITO=sim.
 *
 * Fora de `development` (Vercel, build, testes, scripts com guarda própria)
 * nada muda aqui.
 */
export const VARIAVEL_NEON_EXPLICITO = "NOOO_BANCO_NEON_EXPLICITO";

/** PostgreSQL local (Docker): o driver usado é o `pg`, não o HTTP da Neon. */
export function ehBancoLocal(url: string) {
  const host = new URL(url).hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
}

export function validarDestinoBancoDesenvolvimento({
  url,
  ambienteNode,
  neonExplicito,
}: {
  url: string;
  ambienteNode: string | undefined;
  neonExplicito: string | undefined;
}) {
  if (ambienteNode !== "development") return;
  if (ehBancoLocal(url)) return;
  if (neonExplicito === "sim") return;
  throw new Error(
    "BANCO REMOTO RECUSADO NO DESENVOLVIMENTO: `npm run dev` usa somente o PostgreSQL local " +
      "(DATABASE_URL de .env.local). Para validar online use `npm run dev:neon`. Nenhuma consulta foi executada.",
  );
}
