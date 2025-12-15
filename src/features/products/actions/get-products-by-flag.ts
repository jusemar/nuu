"use server";

import { db } from "@/db";
import { productTable, productVariantTable, productPricingTable } from "@/db/schema";
import { sql } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function getProductsByFlag(flags: string[]) {
  try {
    const allowedFlags = ['general', 'new'];
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
        },
        // Preço principal (mainCardPrice = true)
        mainPrice: {
          price: productPricingTable.price,
          promoPrice: productPricingTable.promoPrice,
          hasPromo: productPricingTable.hasPromo,
          type: productPricingTable.type,
        },
        // Variants
        variants: sql<Array<typeof productVariantTable.$inferSelect>>`
          array_agg(
            json_build_object(
              'id', ${productVariantTable.id},
              'productId', ${productVariantTable.productId},
              'name', ${productVariantTable.name},
              'sku', ${productVariantTable.sku},
              'imageUrl', ${productVariantTable.imageUrl},
              'priceInCents', ${productVariantTable.priceInCents},
              'isActive', ${productVariantTable.isActive},
              'createdAt', ${productVariantTable.createdAt},
              'updatedAt', ${productVariantTable.updatedAt}
            )
          ) as variants
        `,
      })
      .from(productTable)
      // LEFT JOIN com productPricingTable (apenas mainCardPrice = true)
      .leftJoin(
        productPricingTable,
        sql`
          ${productTable.id} = ${productPricingTable.productId}
          AND ${productPricingTable.mainCardPrice} = true
        `
      )
      .leftJoin(
        productVariantTable,
        sql`${productTable.id} = ${productVariantTable.productId}`
      )
      .where(sql`
        ${productTable.storeProductFlags} && ARRAY[${sql.join(filteredFlags, sql`, `)}]::text[]
      `)
      .groupBy(productTable.id, productPricingTable.id) // Inclui productPricingTable no groupBy
      .orderBy(desc(productTable.createdAt));

    // Transformar resultado
    return products.map(({ product, mainPrice, variants }) => ({
      ...product,
      mainPrice: mainPrice || null, // Pode ser null se não tiver preço principal
      variants: variants || [],
    }));
  } catch (error) {
    console.error(`Erro ao buscar produtos com flags ${flags}:`, error);
    return [];
  }
}