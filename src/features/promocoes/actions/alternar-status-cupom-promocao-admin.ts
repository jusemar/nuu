"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { cuponsPromocaoTable } from "../../../db/schema";
import { db } from "../../../db/connection";
import { idPromocaoAdminSchema } from "../schemas";

export async function alternarStatusCupomPromocaoAdmin(
  id: string,
  ativo: boolean,
) {
  const cupomId = idPromocaoAdminSchema.parse(id);

  await db
    .update(cuponsPromocaoTable)
    .set({ ativo, atualizadoEm: new Date() })
    .where(eq(cuponsPromocaoTable.id, cupomId));

  revalidatePath("/admin/marketing/cupons");

  return { success: true };
}
