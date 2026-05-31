"use server";

import { db } from "@/db/connection";
import {
  productTable,
  productGalleryImagesTable,
  productPricingTable,
  produtosTiposLogisticosTable,
  marcaTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { salvarPrecosEntregaPropriaProduto } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import { salvarEstruturaVariantesProduto } from "@/features/products/actions/admin-product-variants.actions";
import type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantFormInput,
} from "@/features/products";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";

function revalidateAdminProductsPath() {
  try {
    revalidatePath("/admin/products");
  } catch (error) {
    console.warn("Nao foi possivel revalidar /admin/products:", error);
  }
}

function converterValorEmInteiro(valor?: string) {
  if (!valor?.trim()) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? Math.round(numero) : null;
}

function converterPesoEmGramas(pesoEmKg?: string) {
  if (!pesoEmKg?.trim()) return null;
  const peso = Number(pesoEmKg);
  return Number.isFinite(peso) && peso >= 0 ? Math.round(peso * 1000) : null;
}

interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  cardShortText: string;
  categoryId: string;
  brandId?: string;
  brand?: string;
  sku: string;
  productType?: string;
  productKind?: ProductKind;
  productCode?: string;
  ncmCode?: string;
  collection?: string;
  tags?: string[];
  storeProductFlags?: string[];
  pricing?: {
    costPrice?: string;
    modalities?: any;
    mainCardPriceType?: string;
  };
  warranty?: {
    period?: string;
    provider?: string;
    terms?: string;
  };

  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;

  images: Array<{
    url?: string;
    isPrimary: boolean;
    altText?: string;
  }>;
  entrega?: {
    permiteRetirada?: boolean;
    modeloRetiradaId?: string | null;
    prazoCustom?: string | null;
    permiteEntregaPropria?: boolean;
    precosEntregaPropria?: ProductOwnDeliveryPriceFormItem[];
    classificacoesLogisticasIds?: string[];
  };
  dimensoesFreteExterno?: DimensoesFreteExternoProduto;
  attributes?: ProductAttributeInput[];
  variants?: ProductVariantFormInput[];
}

async function buscarMarcaPadrao() {
  const [marcaPadrao] = await db
    .select({ id: marcaTable.id, nome: marcaTable.nome })
    .from(marcaTable)
    .where(eq(marcaTable.slug, "generico"))
    .limit(1);

  if (!marcaPadrao) throw new Error("Marca padrão Genérico não encontrada");
  return marcaPadrao;
}

async function buscarMarcaPorId(id: string) {
  const [marca] = await db
    .select({ id: marcaTable.id, nome: marcaTable.nome })
    .from(marcaTable)
    .where(eq(marcaTable.id, id))
    .limit(1);

  return marca ?? null;
}

export async function createProduct(data: CreateProductData) {
  try {
    const marcaPadrao = await buscarMarcaPadrao();
    const marcaSelecionada = data.brandId
      ? await buscarMarcaPorId(data.brandId)
      : null;
    const marcaFinal = marcaSelecionada ?? marcaPadrao;

    // 1. Criar o produto principal
    const [product] = await db
      .insert(productTable)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        marcaId: marcaFinal.id,
        brand: marcaFinal.nome,
        sku: data.sku,
        productType: data.productType,
        productCode: data.productCode,
        ncmCode: data.ncmCode,
        collection: data.collection,
        tags: data.tags,
        storeProductFlags: data.storeProductFlags || [],
        cardShortText: data.cardShortText,
        productKind: data.productKind ?? "simple",
        costPrice: data.pricing?.costPrice
          ? parseInt(data.pricing.costPrice) * 100
          : null,
        warrantyPeriod: data.warranty?.period
          ? parseInt(data.warranty.period)
          : null,
        warrantyProvider: data.warranty?.provider,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        canonicalUrl: data.canonicalUrl,

        // Configuração de retirada local
        allowsPickup: data.entrega?.permiteRetirada ?? false,
        allowsOwnDelivery: data.entrega?.permiteEntregaPropria ?? false,
        modeloRetiradaId: data.entrega?.modeloRetiradaId || null,
        prazoRetiradaCustom: data.entrega?.prazoCustom || null,

        weight: converterPesoEmGramas(data.dimensoesFreteExterno?.pesoEmKg),
        height: converterValorEmInteiro(data.dimensoesFreteExterno?.alturaEmCm),
        width: converterValorEmInteiro(data.dimensoesFreteExterno?.larguraEmCm),
        length: converterValorEmInteiro(
          data.dimensoesFreteExterno?.comprimentoEmCm,
        ),

        status: "draft",
        isActive: true,
      })
      .returning();
    console.log("Produto criado:", product);

    // 2. Adicionar imagens na galeria
    const validImages = data.images.filter((image) => image.url);

    if (validImages.length > 0) {
      await db.insert(productGalleryImagesTable).values(
        validImages.map((image, index) => ({
          productId: product.id,
          imageUrl: image.url!,
          altText: image.altText || data.name,
          isPrimary: image.isPrimary,
          sortOrder: index,
        })),
      );
    }

    // 3. SALVAR MODALIDADES DE PREÇO (apenas texto descritivo)
    if (data.pricing?.modalities) {
      const pricingEntries = Object.entries(data.pricing.modalities).map(
        ([type, modality]: [string, any]) => ({
          productId: product.id,
          type: type,
          price: modality.price ? parseInt(modality.price) * 100 : 0,
          deliveryDays: modality.deliveryText || "",
          pricingModalDescription: modality.deliveryText || "",

          mainCardPrice: data.pricing?.mainCardPriceType === type,

          isActive: true,
        }),
      );

      if (pricingEntries.length > 0) {
        await db.insert(productPricingTable).values(pricingEntries);
      }
    }

    if (data.entrega?.permiteEntregaPropria) {
      await salvarPrecosEntregaPropriaProduto(
        product.id,
        data.entrega.precosEntregaPropria ?? [],
      );
    }

    if (data.entrega?.classificacoesLogisticasIds?.length) {
      await db.insert(produtosTiposLogisticosTable).values(
        data.entrega.classificacoesLogisticasIds.map((tipoLogisticoId) => ({
          produtoId: product.id,
          tipoLogisticoId,
        })),
      );
    }

    await salvarEstruturaVariantesProduto({
      productId: product.id,
      productKind: data.productKind ?? "simple",
      attributes: data.attributes,
      variants: data.variants,
    });

    // 4. Revalidar cache
    revalidateAdminProductsPath();
    return { success: true, productId: product.id };
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return {
      success: false,
      error: "Erro ao criar produto. Tente novamente.",
    };
  }
}
