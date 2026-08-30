import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Diagnóstico temporário: expõe somente dados sanitizados a um admin autenticado. */
export async function GET() {
  const acesso = await buscarSessaoAdmin();

  if (!acesso.autorizado || !acesso.sessao?.user) {
    return Response.json(
      { erro: "Acesso administrativo necessário." },
      { status: 401 },
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return Response.json(
      { erro: "DATABASE_URL não está disponível no runtime." },
      { status: 503 },
    );
  }

  let databaseHost: string;
  try {
    databaseHost = new URL(databaseUrl).hostname;
  } catch {
    return Response.json(
      { erro: "DATABASE_URL possui formato inválido no runtime." },
      { status: 503 },
    );
  }

  return Response.json(
    {
      appEnvironment: process.env.APP_ENVIRONMENT ?? null,
      databaseHost,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
