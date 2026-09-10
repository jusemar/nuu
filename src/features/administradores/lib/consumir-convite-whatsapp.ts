import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import {
  administradoresTable,
  convitesAdministrativosTable,
  provasPosseConvitesAdministrativosTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";

import {
  type TransacaoAutorizacaoAdmin,
  type ValidacaoAceiteConviteWhatsapp,
} from "./validar-aceite-convite-whatsapp";

export async function consumirConviteWhatsappNaTransacao(
  tx: TransacaoAutorizacaoAdmin,
  entrada: {
    administradorId: string;
    contextoHash: string;
    validacao: ValidacaoAceiteConviteWhatsapp;
  },
) {
  const [convite] = await tx.select().from(convitesAdministrativosTable)
    .where(eq(convitesAdministrativosTable.id, entrada.validacao.conviteId)).for("update").limit(1);
  if (!convite || convite.status !== "pendente" || convite.expiraEm <= new Date() || convite.tipoIdentificador !== "whatsapp") return null;
  const [prova] = await tx.select().from(provasPosseConvitesAdministrativosTable).where(and(
    eq(provasPosseConvitesAdministrativosTable.id, entrada.validacao.provaId),
    eq(provasPosseConvitesAdministrativosTable.conviteId, convite.id),
    eq(provasPosseConvitesAdministrativosTable.usuarioId, entrada.validacao.usuarioId),
    eq(provasPosseConvitesAdministrativosTable.contextoHash, entrada.contextoHash),
    eq(provasPosseConvitesAdministrativosTable.finalidade, "admin_convite"),
  )).for("update").limit(1);
  if (!prova || !prova.confirmadoEm || prova.consumidoEm || prova.expiraEm <= new Date()) return null;
  const administrador = await tx.query.administradoresTable.findFirst({
    where: and(eq(administradoresTable.id, entrada.administradorId), eq(administradoresTable.usuarioId, entrada.validacao.usuarioId), eq(administradoresTable.status, "ativo")),
  });
  if (!administrador) return null;
  const agora = new Date();
  const [conviteConsumido] = await tx.update(convitesAdministrativosTable).set({
    status: "aceito", aceitoEm: agora, usuarioDestinatarioId: entrada.validacao.usuarioId, updatedAt: agora,
  }).where(and(eq(convitesAdministrativosTable.id, convite.id), eq(convitesAdministrativosTable.status, "pendente"))).returning({ id: convitesAdministrativosTable.id });
  if (!conviteConsumido) return null;
  const [provaConsumida] = await tx.update(provasPosseConvitesAdministrativosTable).set({ consumidoEm: agora })
    .where(and(eq(provasPosseConvitesAdministrativosTable.id, prova.id), isNull(provasPosseConvitesAdministrativosTable.consumidoEm))).returning({ id: provasPosseConvitesAdministrativosTable.id });
  if (!provaConsumida) throw new Error("PROVA_NAO_CONSUMIDA");
  return { consumido: true as const, conviteId: convite.id, provaId: prova.id, aceitoEm: agora, provaConsumidaEm: agora };
}

export async function consumirConviteWhatsapp(entrada: {
  administradorId: string;
  contextoHash: string;
  conviteId: string;
  provaId: string;
  usuarioId: string;
}) {
  return dbTransacional.transaction(async (tx) => {
    return consumirConviteWhatsappNaTransacao(tx, {
      administradorId: entrada.administradorId,
      contextoHash: entrada.contextoHash,
      validacao: {
        conviteId: entrada.conviteId,
        usuarioId: entrada.usuarioId,
        provaId: entrada.provaId,
        permissoes: [],
        prontoParaAceite: true,
      },
    });
  }).catch(() => null);
}
