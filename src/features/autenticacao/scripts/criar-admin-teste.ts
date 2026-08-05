// Script local: NÃO carrega ambiente por conta própria.
// Ele é lançado por `scripts/lib/executar-script-local.ts` (ver package.json), que valida
// o destino, recusa o endpoint de produção e só então define DATABASE_URL. Importar
// `dotenv/config` aqui reintroduziria o caminho implícito para `.env`, que guarda a URL
// de produção — foi por ali que um seed local acabou consultando o banco principal.

import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { accountTable, sessionTable, userTable } from "@/db/schema";

function lerVariavelObrigatoria(nome: string) {
  const valor = process.env[nome]?.trim();

  if (!valor) throw new Error(`${nome} não configurada para o seed.`);

  return valor;
}

async function criarOuAtualizarAdminTeste() {
  const nome = lerVariavelObrigatoria("ADMIN_SEED_NAME");
  const email = lerVariavelObrigatoria("ADMIN_SEED_EMAIL").toLowerCase();
  const senha = lerVariavelObrigatoria("ADMIN_SEED_PASSWORD");

  if (senha.length < 8) {
    throw new Error("ADMIN_SEED_PASSWORD deve ter pelo menos 8 caracteres.");
  }

  const [usuarioExistente] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  const agora = new Date();
  const usuarioId = usuarioExistente?.id ?? randomUUID();

  if (usuarioExistente) {
    await db
      .update(userTable)
      .set({ name: nome, emailVerified: true, updatedAt: agora })
      .where(eq(userTable.id, usuarioId));
  } else {
    await db.insert(userTable).values({
      id: usuarioId,
      name: nome,
      email,
      emailVerified: true,
      createdAt: agora,
      updatedAt: agora,
    });
  }

  const senhaCriptografada = await hashPassword(senha);
  const [credencialExistente] = await db
    .select({ id: accountTable.id })
    .from(accountTable)
    .where(
      and(
        eq(accountTable.userId, usuarioId),
        eq(accountTable.providerId, "credential"),
      ),
    )
    .limit(1);

  if (credencialExistente) {
    await db
      .update(accountTable)
      .set({ password: senhaCriptografada, updatedAt: agora })
      .where(eq(accountTable.id, credencialExistente.id));
  } else {
    await db.insert(accountTable).values({
      id: randomUUID(),
      accountId: usuarioId,
      providerId: "credential",
      userId: usuarioId,
      password: senhaCriptografada,
      createdAt: agora,
      updatedAt: agora,
    });
  }

  // Revoga sessões anteriores para que a nova credencial seja validada do zero.
  await db.delete(sessionTable).where(eq(sessionTable.userId, usuarioId));

  return {
    usuarioId,
    email,
    credencial: credencialExistente ? "atualizada" : "criada",
  };
}

criarOuAtualizarAdminTeste()
  .then((resultado) => {
    console.log("Admin de teste preparado com sucesso.", resultado);
  })
  .catch((erro) => {
    console.error("[criar-admin-teste]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });
    process.exit(1);
  });
