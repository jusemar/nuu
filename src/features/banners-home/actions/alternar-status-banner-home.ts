"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { bannersHomeTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { alternarStatusBannerHomeSchema } from "../schemas/banner-home.schema";

export async function alternarStatusBannerHome(data: unknown) {
  const { id, ativo } = alternarStatusBannerHomeSchema.parse(data);
  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    const banner = await tx.query.bannersHomeTable.findFirst({
      where: eq(bannersHomeTable.id, id),
    });

    if (!banner) {
      throw new Error("Banner não encontrado.");
    }

    if (ativo && banner.posicao === "secundario_direito") {
      await tx
        .update(bannersHomeTable)
        .set({ ativo: false, updatedAt: agora })
        .where(
          and(
            eq(bannersHomeTable.posicao, banner.posicao),
            eq(bannersHomeTable.ativo, true),
            ne(bannersHomeTable.id, id),
          ),
        );
    }

    await tx
      .update(bannersHomeTable)
      .set({ ativo, updatedAt: agora })
      .where(eq(bannersHomeTable.id, id));
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracoes/banners-home");
  return { success: true };
}
