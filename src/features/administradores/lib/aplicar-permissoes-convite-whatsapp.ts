import "server-only";

import { and, eq } from "drizzle-orm";

import {
  administradoresPermissoesTable,
  administradoresTable,
  convitesPermissoesTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";

import {
  type TransacaoAutorizacaoAdmin,
  type ValidacaoAceiteConviteWhatsapp,
  validarAceiteConviteWhatsappNaTransacao,
} from "./validar-aceite-convite-whatsapp";

export async function aplicarPermissoesConviteWhatsappNaTransacao(
  tx: TransacaoAutorizacaoAdmin,
  entrada: {
    administradorId: string;
    validacao: ValidacaoAceiteConviteWhatsapp;
  },
) {
  const administrador = await tx.query.administradoresTable.findFirst({
    where: and(
      eq(administradoresTable.id, entrada.administradorId),
      eq(administradoresTable.usuarioId, entrada.validacao.usuarioId),
      eq(administradoresTable.status, "ativo"),
    ),
  });
  if (!administrador) return null;
  const permissoes = await tx.select({
    efeito: convitesPermissoesTable.efeito,
    permissaoId: convitesPermissoesTable.permissaoId,
  }).from(convitesPermissoesTable)
    .where(eq(convitesPermissoesTable.conviteId, entrada.validacao.conviteId));
  if (permissoes.length)
    await tx.insert(administradoresPermissoesTable).values(
      permissoes.map(({ efeito, permissaoId }) => ({
        administradorId: administrador.id,
        efeito,
        permissaoId,
      })),
    ).onConflictDoNothing();
  return { administradorId: administrador.id, permissoesAplicadas: permissoes.length };
}

export async function aplicarPermissoesConviteWhatsapp(entrada: {
  contextoHash: string;
  token: string;
  usuarioSessaoId: string | null;
}) {
  return dbTransacional.transaction(async (tx) => {
    const validacao = await validarAceiteConviteWhatsappNaTransacao(tx, entrada);
    if (!validacao) return null;
    const administrador = await tx.query.administradoresTable.findFirst({
      where: and(
        eq(administradoresTable.usuarioId, validacao.usuarioId),
        eq(administradoresTable.status, "ativo"),
      ),
    });
    if (!administrador) return null;
    return aplicarPermissoesConviteWhatsappNaTransacao(tx, {
      administradorId: administrador.id,
      validacao,
    });
  }).catch(() => null);
}
