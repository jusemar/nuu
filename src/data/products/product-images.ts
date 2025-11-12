import { db } from '@/db';
import { productImageTable } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const productImageQueries = {
  // Buscar imagens de uma variante
  getByVariantId: async (variantId: string) => {
    return db
      .select()
      .from(productImageTable)
      .where(eq(productImageTable.productVariantId, variantId))
      .orderBy(asc(productImageTable.sortOrder));
  },

  // Criar imagem
  create: async (data: {
    productVariantId: string;
    imageUrl: string;
    cloudinaryPublicId: string;
    altText?: string;
    sortOrder?: number;
  }) => {
    const [image] = await db
      .insert(productImageTable)
      .values(data)
      .returning();
    return image;
  },

  // Deletar imagem
  delete: async (id: string) => {
    const [image] = await db
      .delete(productImageTable)
      .where(eq(productImageTable.id, id))
      .returning();
    return image;
  },

  // Atualizar ordem
  updateOrder: async (id: string, sortOrder: number) => {
    const [image] = await db
      .update(productImageTable)
      .set({ sortOrder })
      .where(eq(productImageTable.id, id))
      .returning();
    return image;
  },
};