"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  auditoriasAdministrativasTable,
  convitesAdministrativosTable,
} from "@/db/tables/autorizacao-admin";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { montarUrlAbsoluta } from "@/lib/seo/url-site";

import { enviarEmailConviteAdministrativo } from "../lib/emails/enviar-email-convite-administrativo";
import {
  calcularExpiracaoConvite,
  gerarTokenConviteAdministrativo,
} from "../lib/token-convite-administrativo";
import { conviteIdSchema } from "../schemas/convites-administrativos.schema";

export async function revogarConviteAdministrador(entrada: unknown) {
  const contexto = await exigirPermissaoAdmin(
    PERMISSOES_ADMIN.ADMINISTRADORES.ADMINISTRAR,
  );
  const conviteId = conviteIdSchema.parse(entrada);
  const agora = new Date();
  const [convite] = await db
    .update(convitesAdministrativosTable)
    .set({ revogadoEm: agora, status: "revogado", updatedAt: agora })
    .where(
      and(
        eq(convitesAdministrativosTable.id, conviteId),
        eq(convitesAdministrativosTable.status, "pendente"),
      ),
    )
    .returning({ id: convitesAdministrativosTable.id });
  if (!convite)
    return {
      mensagem: "Convite não está mais pendente.",
      sucesso: false as const,
    };
  await db
    .insert(auditoriasAdministrativasTable)
    .values({
      acao: "convite_administrativo_revogado",
      atorAdministradorId: contexto.administradorId,
      recursoId: convite.id,
      recursoTipo: "convite_administrativo",
      resultado: "sucesso",
    });
  revalidatePath("/admin/configuracoes/usuarios-e-permissoes");
  return { sucesso: true as const };
}

export async function reenviarConviteAdministrador(entrada: unknown) {
  const contexto = await exigirPermissaoAdmin(
    PERMISSOES_ADMIN.ADMINISTRADORES.ADMINISTRAR,
  );
  const conviteId = conviteIdSchema.parse(entrada);
  const { token, tokenHash } = gerarTokenConviteAdministrativo();
  const agora = new Date();
  const [convite] = await db
    .update(convitesAdministrativosTable)
    .set({
      emissorAdministradorId: contexto.administradorId,
      expiraEm: calcularExpiracaoConvite(agora),
      tokenHash,
      updatedAt: agora,
    })
    .where(
      and(
        eq(convitesAdministrativosTable.id, conviteId),
        eq(convitesAdministrativosTable.status, "pendente"),
      ),
    )
    .returning({
      email: convitesAdministrativosTable.emailDestinatario,
      id: convitesAdministrativosTable.id,
      nome: convitesAdministrativosTable.nomeDestinatario,
    });
  if (!convite)
    return {
      mensagem: "Convite não está mais pendente.",
      sucesso: false as const,
    };
  try {
    await enviarEmailConviteAdministrativo({
      destinatario: convite.email,
      nome: convite.nome,
      url: montarUrlAbsoluta(
        `/convite-administrativo/${encodeURIComponent(token)}`,
      ),
    });
  } catch {
    await db
      .update(convitesAdministrativosTable)
      .set({
        revogadoEm: new Date(),
        status: "revogado",
        updatedAt: new Date(),
      })
      .where(eq(convitesAdministrativosTable.id, convite.id));
    throw new Error("Não foi possível reenviar o convite.");
  }
  await db
    .insert(auditoriasAdministrativasTable)
    .values({
      acao: "convite_administrativo_reenviado",
      atorAdministradorId: contexto.administradorId,
      recursoId: convite.id,
      recursoTipo: "convite_administrativo",
      resultado: "sucesso",
    });
  revalidatePath("/admin/configuracoes/usuarios-e-permissoes");
  return { sucesso: true as const };
}
