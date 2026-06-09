"use server";

import { db } from "@/db/connection";
import {
  productTable,
  productPricingTable,
  productGalleryImagesTable,
  productVariantTable,
} from "@/db/schema";
import { inArray, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { aplicarPrecosVitrineProdutos } from "../lib/aplicar-precos-vitrine-produtos";

export async function getProductsByFlag(flags: string[]) {
  try {
    const allowedFlags = ["general", "new", "sale", "featured", "bestseller"];
    const filteredFlags = flags.filter((flag) => allowedFlags.includes(flag));

    if (filteredFlags.length === 0) {
      console.warn("Nenhuma flag permitida fornecida.");
      return [];
    }

    const products = await db
      .select({
        // Campos do produto
        product: {
          id: productTable.id,
          slug: productTable.slug,
          name: productTable.name,
          cardShortText: productTable.cardShortText,
          storeProductFlags: productTable.storeProductFlags,
          description: productTable.description,
          productKind: productTable.productKind,
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
          promoType: productPricingTable.promoType,
          promoEndDate: productPricingTable.promoEndDate,
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
        `,
      )
      // LEFT JOIN com productPricingTable (preço principal)
      .leftJoin(
        productPricingTable,
        sql`
          ${productTable.id} = ${productPricingTable.productId}
          AND ${productPricingTable.mainCardPrice} = true
        `,
      )
      .where(
        sql`
        ${productTable.storeProductFlags} && ARRAY[${sql.join(filteredFlags, sql`, `)}]::text[]
      `,
      )
      .groupBy(
        productTable.id,
        productGalleryImagesTable.id,
        productPricingTable.id,
      )
      .orderBy(desc(productTable.createdAt));

    const idsProdutos = products.map(({ product }) => product.id);
    const variantes =
      idsProdutos.length > 0
        ? await db
            .select({
              productId: productVariantTable.productId,
              id: productVariantTable.id,
              sku: productVariantTable.sku,
              name: productVariantTable.name,
              priceInCents: productVariantTable.priceInCents,
              comparePriceInCents: productVariantTable.comparePriceInCents,
              stockQuantity: productVariantTable.stockQuantity,
              isActive: productVariantTable.isActive,
            })
            .from(productVariantTable)
            .where(inArray(productVariantTable.productId, idsProdutos))
        : [];
    const variantesPorProduto = new Map<string, typeof variantes>();

    variantes.forEach((variante) => {
      const variantesAtuais = variantesPorProduto.get(variante.productId) ?? [];
      variantesAtuais.push(variante);
      variantesPorProduto.set(variante.productId, variantesAtuais);
    });

    // Transformar resultado preservando o contrato antigo dos cards.
    const produtosFormatados = products.map(
      ({ product, mainImage, mainPrice }) => ({
        ...product,
        mainImage: mainImage || null,
        mainPrice: mainPrice || null,
        variants: variantesPorProduto.get(product.id) ?? [],
      }),
    );

    return await aplicarPrecosVitrineProdutos(produtosFormatados);
  } catch (error) {
    console.error(`Erro ao buscar produtos com flags ${flags}:`, error);
    return [];
  }
}
