"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { regrasPromocaoTable } from "../../../db/schema";
import { dbTransacional } from "../../../db/transaction";
import { idPromocaoAdminSchema } from "../schemas";
import type { StatusPromocao } from "../types";

export async function alternarStatusPromocaoAdmin(
  id: string,
  status: Extract<StatusPromocao, "ativa" | "inativa">,
) {
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
