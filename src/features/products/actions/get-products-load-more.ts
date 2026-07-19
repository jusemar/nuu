"use server"; // Indica que esta função roda no servidor (Next.js App Router)

import { db } from "@/db/connection"; // Conexão com o banco de dados
import {
  productTable, // Tabela dos produtos
  productPricingTable, // Tabela dos preços dos produtos
  productGalleryImagesTable, // Tabela das imagens da galeria dos produtos
  productVariantTable,
} from "@/db/schema";

import { and, eq, inArray, sql } from "drizzle-orm"; // Permite escrever SQL puro quando necessário
import { aplicarPrecosVitrineProdutos } from "../lib/aplicar-precos-vitrine-produtos";

const TAMANHOS_PAGINA_PERMITIDOS = new Set([6, 9, 12, 15]);

export async function getProductsLoadMore(
  page: number = 1,
  seed = "descoberta",
  pageSize = 6,
) {
  try {
    const paginaSegura = Number.isInteger(page) && page > 0 ? page : 1;
    const tamanhoPaginaSeguro = TAMANHOS_PAGINA_PERMITIDOS.has(pageSize)
      ? pageSize
      : 6;
    const seedSeguro = seed.trim().slice(0, 120) || "descoberta";

    // Calcula quantos produtos pular (para paginação)
    const offset = (paginaSegura - 1) * tamanhoPaginaSeguro;

    // O seed mantém a ordem estável entre as páginas do mesmo carregamento.
    const produtosElegiveis = await db
      .select({
        id: productTable.id,
        slug: productTable.slug,
        name: productTable.name,
        cardShortText: productTable.cardShortText,
        storeProductFlags: productTable.storeProductFlags,
        description: productTable.description,
        productKind: productTable.productKind,
        hasFreeShipping: productTable.hasFreeShipping,
        createdAt: productTable.createdAt,
      })
      .from(productTable)
      .where(
        and(
          eq(productTable.isActive, true),
          eq(productTable.status, "published"),
          sql`${productTable.storeProductFlags} @> ARRAY['general']::text[]`,
        ),
      )
      .orderBy(sql`md5(${productTable.id}::text || ${seedSeguro})`)
      .limit(tamanhoPaginaSeguro + 1)
      .offset(offset);

    const hasMore = produtosElegiveis.length > tamanhoPaginaSeguro;
    const products = produtosElegiveis.slice(0, tamanhoPaginaSeguro);
    const idsProdutos = products.map((product) => product.id);

    const [imagens, precos, variantes] =
      idsProdutos.length > 0
        ? await Promise.all([
            db
              .select({
                productId: productGalleryImagesTable.productId,
                imageUrl: productGalleryImagesTable.imageUrl,
                altText: productGalleryImagesTable.altText,
              })
              .from(productGalleryImagesTable)
              .where(
                and(
                  inArray(productGalleryImagesTable.productId, idsProdutos),
                  eq(productGalleryImagesTable.isPrimary, true),
                ),
              ),
            db
              .select({
                productId: productPricingTable.productId,
                price: productPricingTable.price,
                promoPrice: productPricingTable.promoPrice,
                hasPromo: productPricingTable.hasPromo,
                promoType: productPricingTable.promoType,
                promoEndDate: productPricingTable.promoEndDate,
                type: productPricingTable.type,
              })
              .from(productPricingTable)
              .where(
                and(
                  inArray(productPricingTable.productId, idsProdutos),
                  eq(productPricingTable.mainCardPrice, true),
                ),
              ),
            db
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
              .where(inArray(productVariantTable.productId, idsProdutos)),
          ])
        : [[], [], []];

    const imagemPorProduto = new Map<string, (typeof imagens)[number]>();
    imagens.forEach((imagem) => {
      if (!imagemPorProduto.has(imagem.productId)) {
        imagemPorProduto.set(imagem.productId, imagem);
      }
    });

    const precoPorProduto = new Map<string, (typeof precos)[number]>();
    precos.forEach((preco) => {
      if (!precoPorProduto.has(preco.productId)) {
        precoPorProduto.set(preco.productId, preco);
      }
    });

    const variantesPorProduto = new Map<string, typeof variantes>();

    variantes.forEach((variante) => {
      const variantesAtuais = variantesPorProduto.get(variante.productId) ?? [];
      variantesAtuais.push(variante);
      variantesPorProduto.set(variante.productId, variantesAtuais);
    });

    // Formata os dados para o formato que o componente do grid espera
    const formattedProducts = products.map((product) => ({
      ...product,
      mainImage: imagemPorProduto.get(product.id) ?? null,
      mainPrice: precoPorProduto.get(product.id) ?? null,
      variants: variantesPorProduto.get(product.id) ?? [],
    }));
    const produtosComPrecosVitrine =
      await aplicarPrecosVitrineProdutos(formattedProducts);

    // Retorna os produtos e informa se tem próxima página
    return {
      products: produtosComPrecosVitrine,
      nextPage: hasMore ? paginaSegura + 1 : null,
    };
  } catch (error) {
    // Se der erro, mostra no console e retorna vazio (para não quebrar a página)
    console.error("Erro ao buscar produtos com load more:", error);
    return {
      products: [],
      nextPage: null,
    };
  }
}
