import { createHash, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HASH_TOKEN_DIAGNOSTICO =
  "35587ca9737cd5a1c58dd37b15430052ac867af31bc3f9bc0ce7ad1f57a6c33f";

function tokenAutorizado(request: Request) {
  const token = request.headers.get("x-diagnostico-token");
  if (!token) return false;

  const hashRecebido = createHash("sha256").update(token).digest();
  const hashEsperado = Buffer.from(HASH_TOKEN_DIAGNOSTICO, "hex");

  return timingSafeEqual(hashRecebido, hashEsperado);
}

/** Diagnóstico temporário protegido por token aleatório de uso único. */
export async function GET(request: Request) {
  if (!tokenAutorizado(request)) {
    return Response.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return Response.json({ erro: "Runtime indisponível." }, { status: 503 });
  }

  let databaseHost: string;
  try {
    databaseHost = new URL(databaseUrl).hostname;
  } catch {
    return Response.json({ erro: "Runtime inválido." }, { status: 503 });
  }

  return Response.json(
    {
      appEnvironment: process.env.APP_ENVIRONMENT ?? null,
      databaseHost,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
