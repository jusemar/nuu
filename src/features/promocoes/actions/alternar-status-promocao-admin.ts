"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { regrasPromocaoTable } from "../../../db/schema";
import { dbTransacional } from "../../../db/transaction";
import { idPromocaoAdminSchema } from "../schemas";
import type { StatusPromocao } from "../types";

export async function alternarStatusPromocaoAdmin(
  id: string,
  status: Extract<StatusPromocao, "ativa" | "inativa">,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.MARKETING.PUBLICAR);
  const promocaoId = idPromocaoAdminSchema.parse(id);

  await dbTransacional
    .update(regrasPromocaoTable)
    .set({
      status,
      atualizadoEm: new Date(),
    })
    .where(eq(regrasPromocaoTable.id, promocaoId));

  revalidatePath("/admin/marketing/promocoes");

  return { success: true };
}
