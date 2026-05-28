import "server-only";

import { db } from "@/db/connection";
import {
  productGalleryImagesTable,
  productPricingTable,
  productTable,
} from "@/db/schema";
import { and, eq, inArray, isNotNull } from "drizzle-orm";

export type TipoPromocaoOferta = "normal" | "flash";

export interface ProdutoPromocionalHome {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  cardShortText: string | null;
  description: string | null;
  hasFreeShipping: boolean | null;
  storeProductFlags: string[] | null;
  galleryImages: Array<{
    imageUrl: string;
    isPrimary: boolean | null;
  }>;
  pricing: Array<{
    id: string;
    type: string;
    pricingModalDescription: string | null;
    price: number;
    promoPrice: number;
    hasPromo: boolean | null;
    promoType: TipoPromocaoOferta;
    promoEndDate: Date | null;
    mainCardPrice: boolean | null;
  }>;
}

export interface OfertasHome {
  produtosOfertaRelampago: ProdutoPromocionalHome[];
  produtosPromocaoNormal: ProdutoPromocionalHome[];
}

export async function buscarOfertasHome(): Promise<OfertasHome> {
  const agora = new Date();

  const linhas = await db
    .select({
      produto: {
        id: productTable.id,
        sku: productTable.sku,
        slug: productTable.slug,
        name: productTable.name,
        brand: productTable.brand,
        cardShortText: productTable.cardShortText,
        description: productTable.description,
        hasFreeShipping: productTable.hasFreeShipping,
        storeProductFlags: productTable.storeProductFlags,
      },
      imagemPrincipal: {
        imageUrl: productGalleryImagesTable.imageUrl,
        isPrimary: productGalleryImagesTable.isPrimary,
      },
      precoPromocional: {
        id: productPricingTable.id,
        type: productPricingTable.type,
        pricingModalDescription: productPricingTable.pricingModalDescription,
        price: productPricingTable.price,
        promoPrice: productPricingTable.promoPrice,
        hasPromo: productPricingTable.hasPromo,
        promoType: productPricingTable.promoType,
        promoEndDate: productPricingTable.promoEndDate,
        mainCardPrice: productPricingTable.mainCardPrice,
      },
    })
    .from(productTable)
    .innerJoin(
      productPricingTable,
      eq(productPricingTable.productId, productTable.id),
    )
    .leftJoin(
      productGalleryImagesTable,
      and(
        eq(productGalleryImagesTable.productId, productTable.id),
        eq(productGalleryImagesTable.isPrimary, true),
      ),
    )
    .where(
      and(
        eq(productTable.productKind, "simple"),
        eq(productPricingTable.isActive, true),
        eq(productPricingTable.mainCardPrice, true),
        eq(productPricingTable.hasPromo, true),
        isNotNull(productPricingTable.promoPrice),
        inArray(productPricingTable.promoType, ["normal", "flash"]),
      ),
    );

  const produtosPromocionais = linhas
    .filter((linha) => linha.precoPromocional.promoPrice !== null)
    .map((linha) => ({
      ...linha.produto,
      galleryImages: linha.imagemPrincipal?.imageUrl
        ? [
            {
              imageUrl: linha.imagemPrincipal.imageUrl,
              isPrimary: linha.imagemPrincipal.isPrimary,
            },
          ]
        : [],
      pricing: [
        {
          ...linha.precoPromocional,
          promoPrice: linha.precoPromocional.promoPrice!,
          promoType: linha.precoPromocional.promoType as TipoPromocaoOferta,
        },
      ],
    }));

  return {
    produtosOfertaRelampago: produtosPromocionais.filter((produto) => {
      const preco = produto.pricing[0];
      return (
        preco?.promoType === "flash" &&
        Boolean(preco.promoEndDate) &&
        preco.promoEndDate!.getTime() > agora.getTime()
      );
    }),
    produtosPromocaoNormal: produtosPromocionais.filter(
      (produto) => produto.pricing[0]?.promoType === "normal",
    ),
  };
}
