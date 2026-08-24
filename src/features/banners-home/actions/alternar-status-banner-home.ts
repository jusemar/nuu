"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { bannersHomeTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { alternarStatusBannerHomeSchema } from "../schemas/banner-home.schema";

export async function alternarStatusBannerHome(data: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.BANNERS.ADMINISTRAR);
  const { id, ativo } = alternarStatusBannerHomeSchema.parse(data);
  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    const banner = await tx.query.bannersHomeTable.findFirst({
      where: eq(bannersHomeTable.id, id),
    });

    if (!banner) {
      throw new Error("Banner não encontrado.");
    }

    // Apenas o banner principal aceita vários itens ativos no carrossel.
    if (ativo && banner.posicao !== "principal_esquerdo") {
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
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/admin/configuracoes/banners-home");
  return { success: true };
}
