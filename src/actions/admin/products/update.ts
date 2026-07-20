"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/connection";
import { dbTransacional } from "@/db/transaction";
import {
  categoryTable,
  productTable,
  productPricingTable,
  productVariantTable,
  productGalleryImagesTable,
  marcaTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { salvarPrecosEntregaPropriaProduto } from "@/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import { salvarEstruturaVariantesProduto } from "@/features/products/actions/admin-product-variants.actions";
import type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantFormInput,
} from "@/features/products";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
import {
  descreverErroBancoParaLog,
  erroEhTransitorioDeBanco,
} from "@/features/products/lib/classificar-erro-banco";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/lib/variante-tecnica-produto-simples";

function revalidatePathSeguro(path: string, recurso: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.warn("[produto:atualizacao:falha-revalidacao]", {
      recurso,
      tipo: error instanceof Error ? error.name : "Erro desconhecido",
    });
  }
}

const categoriaIdSchema = z.string().uuid();
const produtoIdSchema = z.string().uuid();

type CodigoErroAtualizacaoProduto =
  | "DADOS_INVALIDOS"
  | "PRODUTO_NAO_ENCONTRADO"
  | "CATEGORIA_INEXISTENTE"
  | "CATEGORIA_INATIVA"
  | "BANCO_INDISPONIVEL"
  | "ERRO_INTERNO";

function falha(codigo: CodigoErroAtualizacaoProduto, message: string) {
  return { success: false as const, codigo, message };
}

function aguardar(milissegundos: number) {
  return new Promise((resolve) => setTimeout(resolve, milissegundos));
}

async function executarLeituraComRetry<T>(
  etapa: string,
  operacao: () => Promise<T>,
) {
  try {
    return await operacao();
  } catch (erro) {
    if (!erroEhTransitorioDeBanco(erro)) throw erro;

    console.warn("[produto:atualizacao:retry-leitura]", {
      etapa,
      tentativa: 2,
      ...descreverErroBancoParaLog(erro),
    });
    await aguardar(250);
    return operacao();
  }
}

async function buscarCategoriaAtivaPorId(id: string) {
  const idValidado = categoriaIdSchema.safeParse(id);
  if (!idValidado.success) return { situacao: "id_invalido" as const };

  const [categoria] = await executarLeituraComRetry("categoria", () =>
    db
      .select({ id: categoryTable.id, isActive: categoryTable.isActive })
      .from(categoryTable)
      .where(eq(categoryTable.id, idValidado.data))
      .limit(1),
  );

  if (!categoria) return { situacao: "inexistente" as const };
  if (!categoria.isActive) return { situacao: "inativa" as const };
  return { situacao: "ativa" as const, categoria };
}

function dadosBasicosSaoValidos(id: string, data: UpdateProductData) {
  if (!produtoIdSchema.safeParse(id).success) return false;
  if (data.categoryId && !categoriaIdSchema.safeParse(data.categoryId).success)
    return false;
  if (data.name !== undefined && !data.name.trim()) return false;
  if (data.slug !== undefined && !data.slug.trim()) return false;
  if (data.sku !== undefined && !data.sku.trim()) return false;
  if (
    !Array.isArray(data.storeProductFlags) ||
    data.storeProductFlags.some((flag) => typeof flag !== "string")
  )
    return false;

  return true;
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

interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  cardShortText?: string;
  categoryId?: string;
  brandId?: string;
  brand?: string;
  sku?: string;
  isActive?: boolean;
  collection?: string;
  tags?: string[];
  storeProductFlags: string[];
  productKind?: ProductKind;
  productType?: string;
  productCode?: string;
  ncmCode?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;

  pricing?: {
    costPrice?: string;
    modalities?: {
      [key: string]: {
        price: string;
        deliveryText: string;
        promo: {
          active: boolean;
          type: string;
          price: string;
          endDate?: Date;
        };
      };
    };
    mainCardPriceType?: string;
  };
  warranty?: {
    period?: string;
    provider?: string;
    terms?: string;
  };
  images?: Array<{
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

export async function updateProduct(id: string, data: UpdateProductData) {
  let etapaAtual = "validacao_dados";

  try {
    if (!dadosBasicosSaoValidos(id, data)) {
      return falha(
        "DADOS_INVALIDOS",
        "Verifique os dados informados e tente novamente.",
      );
    }

    etapaAtual = "consulta_produto";
    const [existingProduct] = await executarLeituraComRetry("produto", () =>
      db.select().from(productTable).where(eq(productTable.id, id)).limit(1),
    );

    if (!existingProduct) {
      return falha("PRODUTO_NAO_ENCONTRADO", "Produto não encontrado.");
    }

    if (data.categoryId !== undefined) {
      etapaAtual = "validacao_categoria";
      const resultadoCategoria = await buscarCategoriaAtivaPorId(
        data.categoryId,
      );

      if (resultadoCategoria.situacao === "id_invalido")
        return falha(
          "DADOS_INVALIDOS",
          "O identificador da categoria é inválido.",
        );
      if (resultadoCategoria.situacao === "inexistente")
        return falha(
          "CATEGORIA_INEXISTENTE",
          "A categoria selecionada não existe.",
        );
      if (resultadoCategoria.situacao === "inativa")
        return falha(
          "CATEGORIA_INATIVA",
          "A categoria selecionada está inativa. Escolha uma categoria ativa.",
        );
    }

    // ✅ CONSTRUIR APENAS CAMPOS QUE FORAM ENVIADOS
    const updateFields: any = {
      updatedAt: new Date(), // Sempre atualiza
    };

    if (data.brandId !== undefined) {
      etapaAtual = "validacao_marca";
      const marcaPadrao = await executarLeituraComRetry(
        "marca_padrao",
        buscarMarcaPadrao,
      );
      const marcaSelecionada = data.brandId
        ? await executarLeituraComRetry("marca_selecionada", () =>
            buscarMarcaPorId(data.brandId!),
          )
        : null;
      const marcaFinal = marcaSelecionada ?? marcaPadrao;
      updateFields.marcaId = marcaFinal.id;
      updateFields.brand = marcaFinal.nome;
    }

    // Apenas adiciona campos que foram explicitamente enviados
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.slug !== undefined) updateFields.slug = data.slug;
    if (data.description !== undefined)
      updateFields.description = data.description;
    if (data.cardShortText !== undefined)
      updateFields.cardShortText = data.cardShortText;
    if (data.categoryId !== undefined)
      updateFields.categoryId = data.categoryId;
    if (data.sku !== undefined) updateFields.sku = data.sku;
    if (data.isActive !== undefined) updateFields.isActive = data.isActive;
    if (data.collection !== undefined)
      updateFields.collection = data.collection;
    if (data.tags !== undefined) updateFields.tags = data.tags;
    if (data.productType !== undefined)
      updateFields.productType = data.productType;
    if (data.productCode !== undefined)
      updateFields.productCode = data.productCode;
    if (data.ncmCode !== undefined) updateFields.ncmCode = data.ncmCode;
    if (data.storeProductFlags !== undefined)
      updateFields.storeProductFlags = data.storeProductFlags;
    if (data.productKind !== undefined)
      updateFields.productKind = data.productKind;
    if (data.metaTitle !== undefined) updateFields.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined)
      updateFields.metaDescription = data.metaDescription;
    if (data.canonicalUrl !== undefined)
      updateFields.canonicalUrl = data.canonicalUrl;
    if (data.dimensoesFreteExterno !== undefined) {
      updateFields.weight = converterPesoEmGramas(
        data.dimensoesFreteExterno.pesoEmKg,
      );
      updateFields.height = converterValorEmInteiro(
        data.dimensoesFreteExterno.alturaEmCm,
      );
      updateFields.width = converterValorEmInteiro(
        data.dimensoesFreteExterno.larguraEmCm,
      );
      updateFields.length = converterValorEmInteiro(
        data.dimensoesFreteExterno.comprimentoEmCm,
      );
    }

    // Campos com transformação
    if (data.pricing?.costPrice !== undefined) {
      updateFields.costPrice = data.pricing.costPrice
        ? Math.round(parseFloat(data.pricing.costPrice) * 100)
        : null;
    }
    if (data.warranty?.period !== undefined) {
      updateFields.warrantyPeriod = data.warranty.period
        ? parseInt(data.warranty.period)
        : null;
    }
    if (data.warranty?.provider !== undefined) {
      updateFields.warrantyProvider = data.warranty.provider;
    }

    // Configuração de retirada local (entrega)
    if (data.entrega !== undefined) {
      updateFields.allowsPickup = data.entrega.permiteRetirada ?? false;
      updateFields.allowsOwnDelivery =
        data.entrega.permiteEntregaPropria ?? false;
      updateFields.modeloRetiradaId = data.entrega.modeloRetiradaId || null;
      updateFields.prazoRetiradaCustom = data.entrega.prazoCustom || null;
    }

    etapaAtual = "transacao_atualizacao";
    await dbTransacional.transaction(async (tx) => {
      const tipoProdutoFinal =
        data.productKind ?? existingProduct.productKind ?? "simple";
      let varianteTecnicaConfiavelId: string | null = null;
      if (
        tipoProdutoFinal === "simple" &&
        existingProduct.productKind === "simple"
      ) {
        const variantesAtuais = await tx
          .select({
            id: productVariantTable.id,
            sku: productVariantTable.sku,
            atributos: productVariantTable.attributes,
            precoEmCentavos: productVariantTable.priceInCents,
            estoque: productVariantTable.stockQuantity,
            ativa: productVariantTable.isActive,
            principal: productVariantTable.isDefault,
          })
          .from(productVariantTable)
          .where(eq(productVariantTable.productId, id));
        const identificacao = identificarVarianteTecnicaProdutoSimples({
          skuProduto: existingProduct.sku,
          variantes: variantesAtuais,
        });
        varianteTecnicaConfiavelId =
          identificacao.situacao === "confiavel"
            ? identificacao.variante.id
            : null;
      }

      if (Object.keys(updateFields).length > 1) {
        await tx
          .update(productTable)
          .set(updateFields)
          .where(eq(productTable.id, id));
      }

      if (
        varianteTecnicaConfiavelId &&
        (data.sku !== undefined ||
          data.name !== undefined ||
          data.dimensoesFreteExterno !== undefined)
      ) {
        await tx
          .update(productVariantTable)
          .set({
            ...(data.sku !== undefined && { sku: data.sku }),
            ...(data.name !== undefined && { name: data.name }),
            ...(data.dimensoesFreteExterno !== undefined && {
              weightInGrams: converterPesoEmGramas(
                data.dimensoesFreteExterno.pesoEmKg,
              ),
              heightInCm: converterValorEmInteiro(
                data.dimensoesFreteExterno.alturaEmCm,
              ),
              widthInCm: converterValorEmInteiro(
                data.dimensoesFreteExterno.larguraEmCm,
              ),
              lengthInCm: converterValorEmInteiro(
                data.dimensoesFreteExterno.comprimentoEmCm,
              ),
            }),
            updatedAt: new Date(),
          })
          .where(eq(productVariantTable.id, varianteTecnicaConfiavelId));
      }

      if (data.pricing?.modalities !== undefined) {
        await tx
          .delete(productPricingTable)
          .where(eq(productPricingTable.productId, id));

        const pricingEntries = Object.entries(data.pricing.modalities)
          .filter(([_, modality]) => modality.price)
          .map(([type, modality]: [string, any]) => {
            let promoDuration = null;
            let promoDurationUnit = null;

            if (modality.promo?.endDate) {
              const now = new Date();
              const endDate = new Date(modality.promo.endDate);
              const diffHours = Math.ceil(
                (endDate.getTime() - now.getTime()) / (1000 * 60 * 60),
              );

              if (diffHours > 0) {
                promoDuration = diffHours;
                promoDurationUnit = "hours";
              }
            }

            return {
              productId: id,
              type,
              price: Math.round(parseFloat(modality.price) * 100),
              deliveryDays: modality.deliveryText || "",
              pricingModalDescription: modality.deliveryText || "",
              mainCardPrice: data.pricing?.mainCardPriceType === type,
              isActive: true,
              hasPromo: modality.promo?.active || false,
              promoType: modality.promo?.type || "normal",
              promoPrice: modality.promo?.price
                ? Math.round(parseFloat(modality.promo.price) * 100)
                : null,
              promoEndDate: modality.promo?.endDate || null,
              promoDuration,
              promoDurationUnit,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });

        if (pricingEntries.length > 0) {
          await tx.insert(productPricingTable).values(pricingEntries);
        }
      }

      if (data.images !== undefined) {
        await tx
          .delete(productGalleryImagesTable)
          .where(eq(productGalleryImagesTable.productId, id));

        const validImages = data.images.filter((image) => image.url);

        if (validImages.length > 0) {
          const imageEntries = validImages.map((image, index) => ({
            productId: id,
            imageUrl: image.url!,
            altText: image.altText || data.name || existingProduct.name,
            isPrimary: image.isPrimary,
            sortOrder: index,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await tx.insert(productGalleryImagesTable).values(imageEntries);
        }
      }

      if (data.entrega !== undefined) {
        await salvarPrecosEntregaPropriaProduto(
          id,
          data.entrega.permiteEntregaPropria
            ? (data.entrega.precosEntregaPropria ?? [])
            : [],
          { executor: tx, revalidar: false },
        );
      }

      if (
        data.productKind !== undefined ||
        data.attributes !== undefined ||
        data.variants !== undefined
      ) {
        await salvarEstruturaVariantesProduto({
          productId: id,
          productKind:
            data.productKind ?? existingProduct.productKind ?? "simple",
          attributes: data.attributes ?? [],
          variants: data.variants ?? [],
          preservarVarianteTecnicaProdutoSimples:
            existingProduct.productKind === "simple",
          executor: tx,
        });
      }
    });

    etapaAtual = "revalidacao_cache";
    revalidatePathSeguro("/admin/products", "lista_admin");
    revalidatePathSeguro(`/admin/products/${id}/edit`, "edicao_admin");
    revalidatePathSeguro(
      `/product/${existingProduct.slug}`,
      "pdp_slug_anterior",
    );
    if (data.slug && data.slug !== existingProduct.slug) {
      revalidatePathSeguro(`/product/${data.slug}`, "pdp_slug_atual");
    }

    return {
      success: true,
      message: "Produto atualizado com sucesso!",
    };
  } catch (error: unknown) {
    const detalhes = descreverErroBancoParaLog(error);
    console.error("[produto:atualizacao:falha]", {
      etapa: etapaAtual,
      ...detalhes,
    });

    if (erroEhTransitorioDeBanco(error)) {
      return falha(
        "BANCO_INDISPONIVEL",
        "Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.",
      );
    }

    return falha(
      "ERRO_INTERNO",
      "Não foi possível atualizar o produto. Tente novamente.",
    );
  }
}
