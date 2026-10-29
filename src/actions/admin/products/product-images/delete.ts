"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { productImageTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function deleteProductImage(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  id = z.uuid().parse(id);
  const [image] = await db
    .delete(productImageTable)
    .where(eq(productImageTable.id, id))
    .returning();

  revalidatePath(`/admin/products/[id]`);
  return image;
}
