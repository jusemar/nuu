"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { productImageTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function updateProductImageOrder(id: string, sortOrder: number) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  id = z.uuid().parse(id);
  sortOrder = z.number().int().min(0).parse(sortOrder);
  const [image] = await db
    .update(productImageTable)
    .set({ sortOrder })
    .where(eq(productImageTable.id, id))
    .returning();

  revalidatePath(`/admin/products/[id]`);
  return image;
}
