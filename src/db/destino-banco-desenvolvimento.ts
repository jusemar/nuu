/**
 * Regras do destino do banco no servidor de desenvolvimento (`next dev`).
 *
 * - `npm run dev`      → sempre o PostgreSQL local (loopback).
 * - qualquer banco remoto → recusado no servidor de desenvolvimento local.
 *
 * Fora de `development` (Vercel, build, testes, scripts com guarda própria)
 * nada muda aqui.
 */
/** PostgreSQL local (Docker): o driver usado é o `pg`, não o HTTP da Neon. */
export function ehBancoLocal(url: string) {
  const host = new URL(url).hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
}

export function validarDestinoBancoDesenvolvimento({
  url,
  ambienteNode,
}: {
  url: string;
  ambienteNode: string | undefined;
}) {
  if (ambienteNode !== "development") return;
  if (ehBancoLocal(url)) return;
  throw new Error(
    "BANCO REMOTO RECUSADO NO DESENVOLVIMENTO: `npm run dev` usa somente o PostgreSQL local " +
      "(DATABASE_URL de .env.local). Nenhuma consulta foi executada.",
  );
}
