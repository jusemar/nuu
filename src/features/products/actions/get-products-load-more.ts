"use server"; // Indica que esta função roda no servidor (Next.js App Router)

import { db } from "@/db/connection"; // Conexão com o banco de dados
import {
  productTable, // Tabela dos produtos
  productPricingTable, // Tabela dos preços dos produtos
  productGalleryImagesTable, // Tabela das imagens da galeria dos produtos
  productVariantTable,
} from "@/db/schema";

import { inArray, sql } from "drizzle-orm"; // Permite escrever SQL puro quando necessário
import { desc } from "drizzle-orm"; // Ordem decrescente (do mais novo para o mais antigo)
import { aplicarPrecosVitrineProdutos } from "../lib/aplicar-precos-vitrine-produtos";

// Quantos produtos mostrar por página (você pode mudar esse número se quiser)
const PAGE_SIZE = 12;

export async function getProductsLoadMore(page: number = 1) {
  try {
    // Calcula quantos produtos pular (para paginação)
    // Exemplo: página 1 → pula 0, página 2 → pula 12, página 3 → pula 24...
    const offset = (page - 1) * PAGE_SIZE;

    const products = await db
      .select({
        // === DADOS DO PRODUTO PRINCIPAL ===
        product: {
          id: productTable.id,
          slug: productTable.slug,
          name: productTable.name,
          cardShortText: productTable.cardShortText, // Texto curto que aparece no card
          storeProductFlags: productTable.storeProductFlags, // Array de flags (ex: ['general', 'new'])
          description: productTable.description,
          productKind: productTable.productKind,
          hasFreeShipping: productTable.hasFreeShipping,
          createdAt: productTable.createdAt, // Data de criação (usada para ordenar)
        },

        // === IMAGEM PRINCIPAL DO PRODUTO ===
        // Pega apenas a imagem marcada como "isPrimary = true"
        mainImage: {
          imageUrl: productGalleryImagesTable.imageUrl,
          altText: productGalleryImagesTable.altText,
        },

        // === PREÇO PRINCIPAL DO PRODUTO ===
        // Pega apenas o preço marcado como "mainCardPrice = true"
        mainPrice: {
          price: productPricingTable.price, // Preço normal (em centavos)
          promoPrice: productPricingTable.promoPrice, // Preço promocional (em centavos)
          hasPromo: productPricingTable.hasPromo, // Se tem promoção
          promoType: productPricingTable.promoType,
          promoEndDate: productPricingTable.promoEndDate,
          type: productPricingTable.type,
        },
      })
      .from(productTable) // Começa pela tabela principal de produtos

      // LEFT JOIN = traz o produto mesmo se não tiver imagem principal
      .leftJoin(
        productGalleryImagesTable,
        sql`
          ${productTable.id} = ${productGalleryImagesTable.productId}
          AND ${productGalleryImagesTable.isPrimary} = true
        `,
      )

      // LEFT JOIN = traz o produto mesmo se não tiver preço principal definido
      .leftJoin(
        productPricingTable,
        sql`
          ${productTable.id} = ${productPricingTable.productId}
          AND ${productPricingTable.mainCardPrice} = true
        `,
      )

      // === FILTRO IMPORTANTE ===
      // Só mostra produtos que têm a flag 'general'
      // Isso faz o grid se comportar igual ao carousel que mostra produtos com flag 'general'
      .where(sql`${productTable.storeProductFlags} && ARRAY['general']::text[]`)

      // Agrupa para evitar linhas duplicadas (caso tenha mais de uma imagem/preço)
      .groupBy(
        productTable.id,
        productGalleryImagesTable.id,
        productPricingTable.id,
      )

      // Ordena do mais novo para o mais antigo
      .orderBy(desc(productTable.createdAt))

      // Limita a quantidade de produtos por página
      .limit(PAGE_SIZE)

      // Pula os produtos das páginas anteriores
      .offset(offset);

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

    // Verifica se ainda tem mais produtos para carregar
    const hasMore = products.length === PAGE_SIZE;

    // Formata os dados para o formato que o componente do grid espera
    const formattedProducts = products.map(
      ({ product, mainImage, mainPrice }) => ({
        ...product, // Todos os dados do produto
        mainImage: mainImage || null, // Se não tiver imagem, coloca null
        mainPrice: mainPrice || null, // Se não tiver preço principal, coloca null
        variants: variantesPorProduto.get(product.id) ?? [],
      }),
    );
    const produtosComPrecosVitrine =
      await aplicarPrecosVitrineProdutos(formattedProducts);

    // Retorna os produtos e informa se tem próxima página
    return {
      products: produtosComPrecosVitrine,
      nextPage: hasMore ? page + 1 : null, // Se carregou 12, tem próxima página
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
