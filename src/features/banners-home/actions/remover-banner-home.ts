"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { bannersHomeTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { idBannerHomeSchema } from "../schemas/banner-home.schema";

export async function removerBannerHome(id: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.BANNERS.ADMINISTRAR);
  const bannerId = idBannerHomeSchema.parse(id);

  await dbTransacional
    .delete(bannersHomeTable)
    .where(eq(bannersHomeTable.id, bannerId));

  revalidatePath("/");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/admin/configuracoes/banners-home");
  return { success: true };
}
