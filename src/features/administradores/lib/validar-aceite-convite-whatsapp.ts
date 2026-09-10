import "server-only";

import { and, eq } from "drizzle-orm";

import { userTable } from "@/db/schema";
import {
  convitesAdministrativosTable,
  convitesPermissoesTable,
  provasPosseConvitesAdministrativosTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";

import { calcularHashTokenConvite } from "./token-convite-administrativo";

export type EntradaValidacaoAceiteConviteWhatsapp = {
  contextoHash: string;
  token: string;
  usuarioSessaoId: string | null;
};

export type TransacaoAutorizacaoAdmin = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

export type ValidacaoAceiteConviteWhatsapp = {
  conviteId: string;
  usuarioId: string;
  provaId: string;
  permissoes: Array<{
    efeito: "permitir" | "negar";
    permissaoId: string;
  }>;
  prontoParaAceite: true;
};

/**
 * Mantém os locks da prova e do convite no chamador para que o aceite inteiro
 * possa ser confirmado ou revertido como uma única operação atômica.
 */
export async function validarAceiteConviteWhatsappNaTransacao(
  tx: TransacaoAutorizacaoAdmin,
  entrada: EntradaValidacaoAceiteConviteWhatsapp,
): Promise<ValidacaoAceiteConviteWhatsapp | null> {
  const [convite] = await tx.select().from(convitesAdministrativosTable)
    .where(eq(convitesAdministrativosTable.tokenHash, calcularHashTokenConvite(entrada.token)))
    .for("update").limit(1);
  if (!convite || convite.status !== "pendente" || convite.expiraEm <= new Date() || convite.tipoIdentificador !== "whatsapp" || !convite.identificadorNormalizado)
    return null;
  const [prova] = await tx.select().from(provasPosseConvitesAdministrativosTable).where(and(
    eq(provasPosseConvitesAdministrativosTable.conviteId, convite.id),
    eq(provasPosseConvitesAdministrativosTable.telefoneNormalizado, convite.identificadorNormalizado),
    eq(provasPosseConvitesAdministrativosTable.contextoHash, entrada.contextoHash),
    eq(provasPosseConvitesAdministrativosTable.finalidade, "admin_convite"),
  )).for("update").limit(1);
  if (!prova || !prova.confirmadoEm || prova.consumidoEm || prova.expiraEm <= new Date() || !prova.usuarioId)
    return null;
  if (entrada.usuarioSessaoId && entrada.usuarioSessaoId !== prova.usuarioId) return null;
  const usuario = await tx.query.userTable.findFirst({
    columns: { id: true, phoneNumber: true, phoneNumberVerified: true },
    where: eq(userTable.id, prova.usuarioId),
  });
  if (!usuario || usuario.phoneNumber !== convite.identificadorNormalizado || !usuario.phoneNumberVerified)
    return null;
  const permissoes = await tx.select({ permissaoId: convitesPermissoesTable.permissaoId, efeito: convitesPermissoesTable.efeito })
    .from(convitesPermissoesTable).where(eq(convitesPermissoesTable.conviteId, convite.id));
  return { conviteId: convite.id, usuarioId: usuario.id, provaId: prova.id, permissoes, prontoParaAceite: true };
}

export async function validarAceiteConviteWhatsapp(
  entrada: EntradaValidacaoAceiteConviteWhatsapp,
) {
  return dbTransacional.transaction((tx) =>
    validarAceiteConviteWhatsappNaTransacao(tx, entrada),
  );
}
