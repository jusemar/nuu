import "server-only";

import { randomUUID } from "node:crypto";

import { and, count, desc, eq, gte, isNull, ne, sql } from "drizzle-orm";

import {
  desafiosConfirmacaoEmailTable,
  sessionTable,
  tentativasConfirmacaoEmailTable,
  userTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { criarHashIdentificador } from "../otp-telefone/criptografia-otp-telefone";
import {
  criarHashTokenConfirmacaoEmail,
  gerarTokenConfirmacaoEmail,
} from "./criptografia-confirmacao-email";
import { POLITICA_CONFIRMACAO_EMAIL } from "./politica-confirmacao-email";

export type ResultadoSolicitacaoEmail =
  | { status: "ENVIAR"; token: string; desafioId: string }
  | { status: "REENVIO" | "LIMITE" };

export type ResultadoConfirmacaoEmail =
  | "VALIDO"
  | "INVALIDO"
  | "EXPIRADO"
  | "REUTILIZADO"
  | "BLOQUEADO"
  | "CONFLITO"
  | "LIMITE";

function segredoObrigatorio() {
  const segredo = process.env.BETTER_AUTH_SECRET?.trim();
  if (!segredo) throw new Error("BETTER_AUTH_SECRET não configurada.");
  return segredo;
}

export async function criarDesafioConfirmacaoEmail({
  usuarioId,
  novoEmail,
  ip,
}: {
  usuarioId: string;
  novoEmail: string;
  ip: string;
}): Promise<ResultadoSolicitacaoEmail> {
  const agora = new Date();
  const segredo = segredoObrigatorio();
  const novoEmailHash = criarHashIdentificador(novoEmail, segredo);
  const ipHash = criarHashIdentificador(ip, segredo);
  const token = gerarTokenConfirmacaoEmail();
  const desafioId = randomUUID();

  const resultado = await dbTransacional.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${usuarioId}))`);
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1_000);
    const [[porUsuario], [porEmail], [porIp], [ultimo]] = await Promise.all([
      tx
        .select({ total: count() })
        .from(desafiosConfirmacaoEmailTable)
        .where(
          and(
            eq(desafiosConfirmacaoEmailTable.userId, usuarioId),
            gte(desafiosConfirmacaoEmailTable.createdAt, umaHoraAtras),
          ),
        ),
      tx
        .select({ total: count() })
        .from(desafiosConfirmacaoEmailTable)
        .where(
          and(
            eq(desafiosConfirmacaoEmailTable.novoEmailHash, novoEmailHash),
            gte(desafiosConfirmacaoEmailTable.createdAt, umaHoraAtras),
          ),
        ),
      tx
        .select({ total: count() })
        .from(desafiosConfirmacaoEmailTable)
        .where(
          and(
            eq(desafiosConfirmacaoEmailTable.ipHash, ipHash),
            gte(desafiosConfirmacaoEmailTable.createdAt, umaHoraAtras),
          ),
        ),
      tx
        .select({ criadoEm: desafiosConfirmacaoEmailTable.createdAt })
        .from(desafiosConfirmacaoEmailTable)
        .where(eq(desafiosConfirmacaoEmailTable.userId, usuarioId))
        .orderBy(desc(desafiosConfirmacaoEmailTable.createdAt))
        .limit(1),
    ]);
    if (
      (porUsuario?.total ?? 0) >=
      POLITICA_CONFIRMACAO_EMAIL.maximoSolicitacoesHora
    )
      return { status: "LIMITE" } as const;
    if (
      (porEmail?.total ?? 0) >=
        POLITICA_CONFIRMACAO_EMAIL.maximoSolicitacoesHoraEmail ||
      (porIp?.total ?? 0) >= POLITICA_CONFIRMACAO_EMAIL.maximoSolicitacoesHoraIp
    )
      return { status: "LIMITE" } as const;
    if (
      ultimo &&
      agora.getTime() - ultimo.criadoEm.getTime() <
        POLITICA_CONFIRMACAO_EMAIL.reenvioSegundos * 1_000
    )
      return { status: "REENVIO" } as const;

    // Somente o desafio mais recente pode continuar ativo.
    await tx
      .update(desafiosConfirmacaoEmailTable)
      .set({ consumidoEm: agora, updatedAt: agora })
      .where(
        and(
          eq(desafiosConfirmacaoEmailTable.userId, usuarioId),
          isNull(desafiosConfirmacaoEmailTable.consumidoEm),
        ),
      );
    await tx.insert(desafiosConfirmacaoEmailTable).values({
      id: desafioId,
      userId: usuarioId,
      novoEmail,
      novoEmailHash,
      tokenHash: criarHashTokenConfirmacaoEmail(token),
      ipHash,
      tentativas: 0,
      expiraEm: new Date(
        agora.getTime() + POLITICA_CONFIRMACAO_EMAIL.validadeMinutos * 60_000,
      ),
      createdAt: agora,
      updatedAt: agora,
    });
    return { status: "ENVIAR", token, desafioId } as const;
  });

  console.info("[autenticacao:cliente:email-confirmacao-solicitada]", {
    usuarioId,
    desafioId: resultado.status === "ENVIAR" ? resultado.desafioId : null,
    emailHash: novoEmailHash,
    resultado: resultado.status,
  });
  return resultado;
}

export async function invalidarDesafioConfirmacaoEmail(desafioId: string) {
  const agora = new Date();
  await dbTransacional
    .update(desafiosConfirmacaoEmailTable)
    .set({ consumidoEm: agora, updatedAt: agora })
    .where(eq(desafiosConfirmacaoEmailTable.id, desafioId));
}

export async function confirmarDesafioEmail({
  usuarioId,
  sessaoId,
  token,
  ip,
}: {
  usuarioId: string;
  sessaoId: string;
  token: string;
  ip: string;
}): Promise<ResultadoConfirmacaoEmail> {
  const agora = new Date();
  const segredo = segredoObrigatorio();
  const tokenHash = criarHashTokenConfirmacaoEmail(token);
  const ipHash = criarHashIdentificador(ip, segredo);

  const resultado = await dbTransacional.transaction(async (tx) => {
    const umaHoraAtras = new Date(agora.getTime() - 60 * 60 * 1_000);
    const [porIp] = await tx
      .select({ total: count() })
      .from(tentativasConfirmacaoEmailTable)
      .where(
        and(
          eq(tentativasConfirmacaoEmailTable.ipHash, ipHash),
          gte(tentativasConfirmacaoEmailTable.createdAt, umaHoraAtras),
        ),
      );
    if (
      (porIp?.total ?? 0) >= POLITICA_CONFIRMACAO_EMAIL.maximoConfirmacoesHoraIp
    )
      return "LIMITE" as const;
    await tx.insert(tentativasConfirmacaoEmailTable).values({
      id: randomUUID(),
      ipHash,
      createdAt: agora,
      updatedAt: agora,
    });

    const [desafio] = await tx
      .select()
      .from(desafiosConfirmacaoEmailTable)
      .where(eq(desafiosConfirmacaoEmailTable.tokenHash, tokenHash))
      .for("update")
      .limit(1);
    if (!desafio || desafio.userId !== usuarioId) return "INVALIDO" as const;
    if (desafio.consumidoEm) return "REUTILIZADO" as const;
    if (desafio.expiraEm <= agora) {
      await tx
        .update(desafiosConfirmacaoEmailTable)
        .set({ consumidoEm: agora, updatedAt: agora })
        .where(eq(desafiosConfirmacaoEmailTable.id, desafio.id));
      return "EXPIRADO" as const;
    }
    if (
      desafio.tentativas >= POLITICA_CONFIRMACAO_EMAIL.maximoTentativasDesafio
    )
      return "BLOQUEADO" as const;

    const [conflito] = await tx
      .select({ id: userTable.id })
      .from(userTable)
      .where(
        and(
          eq(userTable.email, desafio.novoEmail),
          ne(userTable.id, usuarioId),
        ),
      )
      .limit(1);
    if (conflito) {
      await tx
        .update(desafiosConfirmacaoEmailTable)
        .set({ consumidoEm: agora, updatedAt: agora })
        .where(eq(desafiosConfirmacaoEmailTable.id, desafio.id));
      return "CONFLITO" as const;
    }

    await tx
      .update(userTable)
      .set({ email: desafio.novoEmail, emailVerified: true, updatedAt: agora })
      .where(eq(userTable.id, usuarioId));
    await tx
      .update(desafiosConfirmacaoEmailTable)
      .set({ consumidoEm: agora, updatedAt: agora })
      .where(
        and(
          eq(desafiosConfirmacaoEmailTable.userId, usuarioId),
          isNull(desafiosConfirmacaoEmailTable.consumidoEm),
        ),
      );
    await tx
      .delete(sessionTable)
      .where(
        and(eq(sessionTable.userId, usuarioId), ne(sessionTable.id, sessaoId)),
      );
    return "VALIDO" as const;
  });

  console.info("[autenticacao:cliente:email-confirmacao-processada]", {
    usuarioId,
    ipHash,
    resultado,
  });
  return resultado;
}
