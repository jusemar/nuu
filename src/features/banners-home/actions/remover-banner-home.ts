"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { bannersHomeTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { idBannerHomeSchema } from "../schemas/banner-home.schema";

export async function removerBannerHome(id: unknown) {
  const bannerId = idBannerHomeSchema.parse(id);

  await dbTransacional
    .delete(bannersHomeTable)
    .where(eq(bannersHomeTable.id, bannerId));

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/banners-home");
  return { success: true };
}
