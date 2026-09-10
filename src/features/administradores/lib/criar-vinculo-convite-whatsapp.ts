import "server-only";

import { eq } from "drizzle-orm";

import { administradoresTable } from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";

import {
  type TransacaoAutorizacaoAdmin,
  type ValidacaoAceiteConviteWhatsapp,
  validarAceiteConviteWhatsappNaTransacao,
} from "./validar-aceite-convite-whatsapp";

export type VinculoConviteWhatsapp = {
  administradorId: string;
  reutilizado: boolean;
};

export async function criarOuReutilizarVinculoConviteWhatsappNaTransacao(
  tx: TransacaoAutorizacaoAdmin,
  validacao: ValidacaoAceiteConviteWhatsapp,
): Promise<VinculoConviteWhatsapp | null> {
  const existente = await tx.query.administradoresTable.findFirst({
    where: eq(administradoresTable.usuarioId, validacao.usuarioId),
  });
  if (existente) {
    if (existente.status !== "ativo") return null;
    return { administradorId: existente.id, reutilizado: true };
  }
  const [criado] = await tx.insert(administradoresTable).values({
    administradorPrincipal: false,
    ativadoEm: new Date(),
    status: "ativo",
    usuarioId: validacao.usuarioId,
    versaoAutorizacao: 1,
  }).returning({ id: administradoresTable.id });
  if (!criado) throw new Error("VINCULO_NAO_CRIADO");
  return { administradorId: criado.id, reutilizado: false };
}

export async function criarVinculoConviteWhatsapp(entrada: {
  contextoHash: string;
  token: string;
  usuarioSessaoId: string | null;
}) {
  return dbTransacional.transaction(async (tx) => {
    const validacao = await validarAceiteConviteWhatsappNaTransacao(tx, entrada);
    if (!validacao) return null;
    return criarOuReutilizarVinculoConviteWhatsappNaTransacao(tx, validacao);
  }).catch(() => null);
}
