"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  marcaTable,
  productGalleryImagesTable,
  productPricingTable,
  productTable,
  productVariantTable,
  produtosTiposLogisticosTable,
} from "@/db/schema";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
import { salvarPrecosEntregaPropriaProduto } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantFormInput,
} from "@/features/products";
import { salvarEstruturaVariantesProduto } from "@/features/products/actions/admin-product-variants.actions";
import {
  ErroIdentificadorCatalogo,
  salvarIdentificadorCatalogo,
} from "@/features/products/actions/salvar-identificador-catalogo";
import { validarGtin } from "@/features/products/lib/identificadores-catalogo";
import { normalizarEstoqueProdutoSimples } from "@/features/products/lib/normalizar-estoque-produto-simples";

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
  gtinProdutoSimples?: string;
  mpnProduto?: string;
  procedenciaIdentificadores?: {
    origem: "manual_admin" | "fornecedor_importacao";
    fornecedorId?: string | null;
    referenciaOrigem?: string | null;
  };
  estoqueProdutoSimples?: number;
  collection?: string;
  tags?: string[];
  storeProductFlags?: string[];
  pricing?: {
    costPrice?: string;
    modalities?: Record<
      string,
      {
        price?: string;
        deliveryText?: string;
      }
    >;
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
    aceitaPagamentoNaEntrega?: boolean;
    precosEntregaPropria?: ProductOwnDeliveryPriceFormItem[];
    classificacoesLogisticasIds?: string[];
  };
  dimensoesFreteExterno?: DimensoesFreteExternoProduto;
  attributes?: ProductAttributeInput[];
  variants?: ProductVariantFormInput[];
  status?: "draft" | "published";
  isActive?: boolean;
  varianteTecnicaProdutoSimples?: {
    precoEmCentavos: number;
    estoque: number;
    imagemUrl?: string | null;
  };
}

function converterPrecoEmCentavos(valor?: string) {
  if (!valor?.trim()) return null;
  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) && numero >= 0
    ? Math.round(numero * 100)
    : null;
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
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  let produtoCriadoId: string | null = null;

  try {
    if (
      (data.productKind ?? "simple") === "simple" &&
      data.gtinProdutoSimples?.trim() &&
      !validarGtin(data.gtinProdutoSimples).valido
    ) {
      return { success: false, error: "Informe um GTIN válido." };
    }
    const estoqueProdutoSimples = normalizarEstoqueProdutoSimples(
      data.estoqueProdutoSimples ??
        data.varianteTecnicaProdutoSimples?.estoque ??
        0,
    );

    if (
      (data.productKind ?? "simple") === "simple" &&
      estoqueProdutoSimples === null
    ) {
      return {
        success: false,
        error: "Informe um estoque inteiro igual ou maior que zero.",
      };
    }

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
        storeProductFlags: data.storeProductFlags ?? ["general"],
        cardShortText: data.cardShortText,
        productKind: data.productKind ?? "simple",
        costPrice: converterPrecoEmCentavos(data.pricing?.costPrice),
        salePrice: data.varianteTecnicaProdutoSimples?.precoEmCentavos ?? null,
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
        // Opt-in: sem marcação explícita do gestor, o produto não aceita.
        aceitaPagamentoNaEntrega:
          data.entrega?.aceitaPagamentoNaEntrega ?? false,
        modeloRetiradaId: data.entrega?.modeloRetiradaId || null,
        prazoRetiradaCustom: data.entrega?.prazoCustom || null,

        weight: converterPesoEmGramas(data.dimensoesFreteExterno?.pesoEmKg),
        height: converterValorEmInteiro(data.dimensoesFreteExterno?.alturaEmCm),
        width: converterValorEmInteiro(data.dimensoesFreteExterno?.larguraEmCm),
        length: converterValorEmInteiro(
          data.dimensoesFreteExterno?.comprimentoEmCm,
        ),

        status: data.status ?? "draft",
        isActive: data.isActive ?? true,
      })
      .returning();
    produtoCriadoId = product.id;
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
        ([type, modality]) => ({
          productId: product.id,
          type: type,
          price: converterPrecoEmCentavos(modality.price) ?? 0,
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
      marcaId: marcaFinal.id,
    });

    let varianteTecnicaId: string | null = null;
    if ((data.productKind ?? "simple") === "simple") {
      const precoTecnico =
        data.varianteTecnicaProdutoSimples?.precoEmCentavos ??
        obterPrecoPrincipalFormulario(data.pricing);
      const [varianteTecnica] = await db
        .insert(productVariantTable)
        .values({
          productId: product.id,
          sku: data.sku,
          name: data.name,
          attributes: {},
          priceInCents: precoTecnico,
          // Produto simples mantém o estoque exclusivamente na variante técnica.
          stockQuantity: estoqueProdutoSimples ?? 0,
          weightInGrams: converterPesoEmGramas(
            data.dimensoesFreteExterno?.pesoEmKg,
          ),
          heightInCm: converterValorEmInteiro(
            data.dimensoesFreteExterno?.alturaEmCm,
          ),
          widthInCm: converterValorEmInteiro(
            data.dimensoesFreteExterno?.larguraEmCm,
          ),
          lengthInCm: converterValorEmInteiro(
            data.dimensoesFreteExterno?.comprimentoEmCm,
          ),
          imageUrl:
            data.varianteTecnicaProdutoSimples?.imagemUrl ??
            validImages.find((imagem) => imagem.isPrimary)?.url ??
            validImages[0]?.url ??
            null,
          isActive: true,
          isDefault: true,
          updatedAt: new Date(),
        })
        .returning({ id: productVariantTable.id });

      varianteTecnicaId = varianteTecnica.id;

      if (data.gtinProdutoSimples?.trim()) {
        await salvarIdentificadorCatalogo({
          tipo: "gtin",
          valor: data.gtinProdutoSimples,
          varianteId: varianteTecnica.id,
          marcaId: marcaFinal.id,
          origem: data.procedenciaIdentificadores?.origem ?? "manual_admin",
          fornecedorId: data.procedenciaIdentificadores?.fornecedorId,
          referenciaOrigem: data.procedenciaIdentificadores?.referenciaOrigem,
        });
      }
    }

    if (data.mpnProduto?.trim()) {
      await salvarIdentificadorCatalogo({
        tipo: "mpn",
        valor: data.mpnProduto,
        produtoId: product.id,
        marcaId: marcaFinal.id,
        origem: data.procedenciaIdentificadores?.origem ?? "manual_admin",
        fornecedorId: data.procedenciaIdentificadores?.fornecedorId,
        referenciaOrigem: data.procedenciaIdentificadores?.referenciaOrigem,
      });
    }

    // 4. Revalidar cache
    revalidateAdminProductsPath();
    return {
      success: true,
      productId: product.id,
      slug: product.slug,
      varianteTecnicaId,
    };
  } catch (error) {
    console.error("Erro ao criar produto:", error);

    if (produtoCriadoId) {
      try {
        await db
          .delete(productTable)
          .where(eq(productTable.id, produtoCriadoId));
      } catch (erroLimpeza) {
        console.error("Erro ao remover produto incompleto:", erroLimpeza);
      }
    }

    return {
      success: false,
      error:
        error instanceof ErroIdentificadorCatalogo
          ? error.message
          : "Erro ao criar produto. Tente novamente.",
    };
  }
}

function obterPrecoPrincipalFormulario(pricing: CreateProductData["pricing"]) {
  const modalidades = pricing?.modalities ?? {};
  const principal = pricing?.mainCardPriceType
    ? modalidades[pricing.mainCardPriceType]
    : undefined;
  const precoPrincipal = converterPrecoEmCentavos(principal?.price);
  if (precoPrincipal !== null) return precoPrincipal;

  for (const tipo of ["stock", "preSale", "dropshipping", "orderBasis"]) {
    const preco = converterPrecoEmCentavos(modalidades[tipo]?.price);
    if (preco !== null) return preco;
  }

  return 0;
}
