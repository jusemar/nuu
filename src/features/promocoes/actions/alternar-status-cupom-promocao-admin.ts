"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { db } from "../../../db/connection";
import { cuponsPromocaoTable } from "../../../db/schema";
import { idPromocaoAdminSchema } from "../schemas";

export async function alternarStatusCupomPromocaoAdmin(
  id: string,
  ativo: boolean,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.MARKETING.PUBLICAR);
  const cupomId = idPromocaoAdminSchema.parse(id);

  await db
    .update(cuponsPromocaoTable)
    .set({ ativo, atualizadoEm: new Date() })
    .where(eq(cuponsPromocaoTable.id, cupomId));

  revalidatePath("/admin/marketing/cupons");

  return { success: true };
}
