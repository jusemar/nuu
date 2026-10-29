"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { productImageTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function createProductImage(data: {
  productVariantId: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  altText?: string;
  sortOrder?: number;
}) {
  // Representantes permanecem somente leitura, inclusive com permissões globais extras.
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  data = z
    .object({
      productVariantId: z.uuid(),
      imageUrl: z.url(),
      cloudinaryPublicId: z.string().min(1),
      altText: z.string().max(1000).optional(),
      sortOrder: z.number().int().min(0).optional(),
    })
    .strict()
    .parse(data);

  const [image] = await db
    .insert(productImageTable)
    .values({
      productVariantId: data.productVariantId,
      imageUrl: data.imageUrl,
      externalImageId: data.cloudinaryPublicId,
      altText: data.altText,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath(`/admin/products/[id]`);
  return image;
}
