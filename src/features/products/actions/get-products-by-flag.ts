"use server";

import { db } from "@/db";
import { 
  productTable, 
  productPricingTable, 
  productGalleryImagesTable 
} from "@/db/schema";
import { sql } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function getProductsByFlag(flags: string[]) {
  try {
    const allowedFlags = ['general', 'new', 'sale'];
    const filteredFlags = flags.filter(flag => allowedFlags.includes(flag));
    
    if (filteredFlags.length === 0) {
      console.warn('Nenhuma flag permitida fornecida.');
      return [];
    }

    const products = await db
      .select({
        // Campos do produto
        product: {
          id: productTable.id,
          name: productTable.name,
          cardShortText: productTable.cardShortText,
          storeProductFlags: productTable.storeProductFlags,
          description: productTable.description,
          hasFreeShipping: productTable.hasFreeShipping,
        },
        // Imagem principal da galeria
        mainImage: {
          imageUrl: productGalleryImagesTable.imageUrl,
          altText: productGalleryImagesTable.altText,
        },
        // Preço principal
        mainPrice: {
          price: productPricingTable.price,
          promoPrice: productPricingTable.promoPrice,
          hasPromo: productPricingTable.hasPromo,
          type: productPricingTable.type,
        },
      })
      .from(productTable)
      // LEFT JOIN com productGalleryImagesTable (imagem primária)
      .leftJoin(
        productGalleryImagesTable,
        sql`
          ${productTable.id} = ${productGalleryImagesTable.productId}
          AND ${productGalleryImagesTable.isPrimary} = true
        `
      )
      // LEFT JOIN com productPricingTable (preço principal)
      .leftJoin(
        productPricingTable,
        sql`
          ${productTable.id} = ${productPricingTable.productId}
          AND ${productPricingTable.mainCardPrice} = true
        `
      )
      .where(sql`
        ${productTable.storeProductFlags} && ARRAY[${sql.join(filteredFlags, sql`, `)}]::text[]
      `)
      .groupBy(productTable.id, productGalleryImagesTable.id, productPricingTable.id)
      .orderBy(desc(productTable.createdAt));

    // Transformar resultado
    return products.map(({ product, mainImage, mainPrice }) => ({
      ...product,
      mainImage: mainImage || null,
      mainPrice: mainPrice || null,
    }));
  } catch (error) {
    console.error(`Erro ao buscar produtos com flags ${flags}:`, error);
    return [];
  }
}