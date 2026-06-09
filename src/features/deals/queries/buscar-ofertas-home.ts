import "server-only";

import { db } from "@/db/connection";
import {
  productGalleryImagesTable,
  productPricingTable,
  productTable,
} from "@/db/schema";
import {
  adaptarPrecosVitrine,
  criarPrecoPrincipalCompatibilidadeVitrine,
  type PrecosVitrineNormalizados,
} from "@/features/precificacao";
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
    percentualOff?: number | null;
    economiaEmCentavos?: number | null;
    badgePromocional?: "promocao" | "relampago" | null;
    tipoCampanhaPromocional?: "promocao_normal" | "oferta_relampago" | null;
    countdownPromocionalDataFim?: Date | null;
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
  const precosVitrine: PrecosVitrineNormalizados = await adaptarPrecosVitrine(
    produtosPromocionais,
  ).catch((error) => {
    console.error("Erro ao adaptar precos das ofertas da home", error);

    return {
      precosPorChave: {},
      produtosPorId: {},
    };
  });
  const produtosComPrecosVitrine = produtosPromocionais.map((produto) => {
    const precoVitrine =
      precosVitrine.produtosPorId[produto.id]?.precoPrincipal ?? null;
    const precoCompatibilidade =
      criarPrecoPrincipalCompatibilidadeVitrine(precoVitrine);

    if (!precoCompatibilidade) {
      return {
        ...produto,
        pricing: produto.pricing.map((preco) => ({
          ...preco,
          badgePromocional: null,
          tipoCampanhaPromocional: null,
          countdownPromocionalDataFim: null,
        })),
      };
    }

    return {
      ...produto,
      pricing: produto.pricing.map((preco, indice) =>
        indice === 0
          ? {
              ...preco,
              price: precoCompatibilidade.price,
              promoPrice:
                precoCompatibilidade.promoPrice ?? precoCompatibilidade.price,
              hasPromo: precoCompatibilidade.hasPromo,
              percentualOff: precoCompatibilidade.percentualOff,
              economiaEmCentavos: precoCompatibilidade.economiaEmCentavos,
              badgePromocional: precoCompatibilidade.badgePromocional,
              tipoCampanhaPromocional:
                precoCompatibilidade.tipoCampanhaPromocional,
              countdownPromocionalDataFim:
                precoCompatibilidade.countdownPromocionalDataFim,
            }
          : {
              ...preco,
              badgePromocional: null,
              tipoCampanhaPromocional: null,
              countdownPromocionalDataFim: null,
            },
      ),
    };
  });

  return {
    produtosOfertaRelampago: produtosComPrecosVitrine.filter((produto) => {
      const preco = produto.pricing[0];
      const dataFimCountdown =
        preco?.countdownPromocionalDataFim ?? preco?.promoEndDate;

      return (
        (preco?.badgePromocional === "relampago" ||
          preco?.promoType === "flash") &&
        Boolean(dataFimCountdown) &&
        new Date(dataFimCountdown!).getTime() > agora.getTime()
      );
    }),
    produtosPromocaoNormal: produtosComPrecosVitrine.filter(
      (produto) => produto.pricing[0]?.promoType === "normal",
    ),
  };
}
