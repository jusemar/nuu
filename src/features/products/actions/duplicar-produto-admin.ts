"use server";

import { randomUUID } from "node:crypto";

import { eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  categoryTable,
  productAttributeTable,
  productDeliveryMethodsTable,
  productGalleryImagesTable,
  productImageTable,
  productOwnDeliveryPrices,
  productPricingTable,
  productSuppliersTable,
  productTable,
  productVariantImageTable,
  productVariantTable,
  produtosTiposLogisticosTable,
  regrasProdutosFreteTable,
  variantesTiposLogisticosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { validarAcessoAdmin } from "@/features/autenticacao/actions/validar-acesso-admin";
import { gerarSkuDisponivel } from "@/features/products/lib/gerar-sku-disponivel";
import { buildVariantSku } from "@/features/products/lib/variant-editor";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/lib/variante-tecnica-produto-simples";

const produtoIdSchema = z.string().uuid();

class ErroDuplicacaoProduto extends Error {}

function gerarSlugCopia(slugOriginal: string) {
  return `${slugOriginal}-copia-${randomUUID()}`;
}

export async function duplicarProdutoAdmin(produtoId: string) {
  const acesso = await validarAcessoAdmin();
  if (!acesso.sucesso) {
    return { sucesso: false as const, erro: acesso.erro };
  }

  const idValidado = produtoIdSchema.safeParse(produtoId);
  if (!idValidado.success) {
    return { sucesso: false as const, erro: "Produto inválido." };
  }

  try {
    const novoProduto = await dbTransacional.transaction(async (tx) => {
      const bloqueio = await tx.execute(sql<{ adquirido: boolean }>`
        select pg_try_advisory_xact_lock(hashtext(${idValidado.data})) as adquirido
      `);

      if (!bloqueio.rows[0]?.adquirido) {
        throw new ErroDuplicacaoProduto(
          "Este produto já está sendo duplicado.",
        );
      }

      const produtoOriginal = await tx.query.productTable.findFirst({
        where: eq(productTable.id, idValidado.data),
      });
      if (!produtoOriginal) {
        throw new ErroDuplicacaoProduto("Produto não encontrado.");
      }

      const [categoria] = await tx
        .select({ nome: categoryTable.name })
        .from(categoryTable)
        .where(eq(categoryTable.id, produtoOriginal.categoryId))
        .limit(1);

      async function skuExiste(sku: string) {
        const [existente] = await tx
          .select({ id: productTable.id })
          .from(productTable)
          .leftJoin(productVariantTable, eq(productVariantTable.sku, sku))
          .where(
            or(eq(productTable.sku, sku), eq(productVariantTable.sku, sku)),
          )
          .limit(1);
        return Boolean(existente);
      }

      const novoSku = await gerarSkuDisponivel({
        nomeCategoria: categoria?.nome,
        nomeMarca: produtoOriginal.brand,
        skuExiste,
      });

      const agora = new Date();
      const {
        id: _id,
        slug: _slug,
        sku: _sku,
        name: _name,
        status: _status,
        isActive: _isActive,
        canonicalUrl: _canonicalUrl,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...dadosCopiaveis
      } = produtoOriginal;

      const [produtoCriado] = await tx
        .insert(productTable)
        .values({
          ...dadosCopiaveis,
          name: `${produtoOriginal.name} - Cópia`,
          slug: gerarSlugCopia(produtoOriginal.slug),
          sku: novoSku,
          productCode: null,
          sellerCode: null,
          internalCode: null,
          status: "draft",
          isActive: false,
          canonicalUrl: null,
          createdAt: agora,
          updatedAt: agora,
        })
        .returning({ id: productTable.id, slug: productTable.slug });

      if (!produtoCriado) {
        throw new ErroDuplicacaoProduto("Não foi possível criar a cópia.");
      }
      const novoProdutoId = produtoCriado.id;

      const precos = await tx
        .select()
        .from(productPricingTable)
        .where(eq(productPricingTable.productId, produtoOriginal.id));
      if (precos.length > 0) {
        await tx.insert(productPricingTable).values(
          precos.map((preco) => ({
            productId: novoProdutoId,
            type: preco.type,
            pricingModalDescription: preco.pricingModalDescription,
            price: preco.price,
            mainCardPrice: preco.mainCardPrice,
            deliveryDays: preco.deliveryDays,
            hasPromo: preco.hasPromo,
            promoType: preco.promoType,
            promoPrice: preco.promoPrice,
            promoEndDate: preco.promoEndDate,
            promoDuration: preco.promoDuration,
            promoDurationUnit: preco.promoDurationUnit,
            isActive: preco.isActive,
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }

      const imagensGaleria = await tx
        .select()
        .from(productGalleryImagesTable)
        .where(eq(productGalleryImagesTable.productId, produtoOriginal.id));
      if (imagensGaleria.length > 0) {
        await tx.insert(productGalleryImagesTable).values(
          imagensGaleria.map((imagem) => ({
            productId: novoProdutoId,
            imageUrl: imagem.imageUrl,
            altText: imagem.altText,
            isPrimary: imagem.isPrimary,
            sortOrder: imagem.sortOrder,
            createdAt: agora,
          })),
        );
      }

      const atributos = await tx
        .select()
        .from(productAttributeTable)
        .where(eq(productAttributeTable.productId, produtoOriginal.id));
      if (atributos.length > 0) {
        await tx.insert(productAttributeTable).values(
          atributos.map((atributo) => ({
            productId: novoProdutoId,
            name: atributo.name,
            values: atributo.values,
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }

      const variantes = await tx
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, produtoOriginal.id));
      const varianteNovaPorAntiga = new Map<string, string>();

      if (produtoOriginal.productKind === "simple") {
        const identificacao = identificarVarianteTecnicaProdutoSimples({
          skuProduto: produtoOriginal.sku,
          variantes: variantes.map((variante) => ({
            id: variante.id,
            sku: variante.sku,
            atributos: variante.attributes,
            precoEmCentavos: variante.priceInCents,
            estoque: variante.stockQuantity,
            ativa: variante.isActive,
            principal: variante.isDefault,
          })),
        });

        if (identificacao.situacao !== "confiavel") {
          throw new ErroDuplicacaoProduto(
            "Não foi possível duplicar este produto simples porque seu registro interno precisa ser corrigido antes.",
          );
        }

        const varianteOriginal = variantes.find(
          (variante) => variante.id === identificacao.variante.id,
        );
        if (!varianteOriginal) {
          throw new ErroDuplicacaoProduto(
            "Não foi possível preparar a variante interna do produto duplicado.",
          );
        }

        const novoId = randomUUID();
        // Produto simples possui uma única variante interna. Ela precisa usar
        // exatamente o SKU do produto, nunca o sufixo das variantes comerciais.
        await tx.insert(productVariantTable).values({
          id: novoId,
          productId: novoProdutoId,
          sku: novoSku,
          name: varianteOriginal.name,
          attributes: {},
          priceInCents: varianteOriginal.priceInCents,
          comparePriceInCents: varianteOriginal.comparePriceInCents,
          costPriceInCents: varianteOriginal.costPriceInCents,
          stockQuantity: varianteOriginal.stockQuantity,
          weightInGrams: varianteOriginal.weightInGrams,
          lengthInCm: varianteOriginal.lengthInCm,
          widthInCm: varianteOriginal.widthInCm,
          heightInCm: varianteOriginal.heightInCm,
          aceitaPagamentoNaEntrega: varianteOriginal.aceitaPagamentoNaEntrega,
          isActive: true,
          isDefault: true,
          imageUrl: varianteOriginal.imageUrl,
          createdAt: agora,
          updatedAt: agora,
        });
        varianteNovaPorAntiga.set(varianteOriginal.id, novoId);
      } else if (variantes.length > 0) {
        const skusReservados = new Set<string>([novoSku]);
        const variantesComNovosIds = [];
        for (let indice = 0; indice < variantes.length; indice += 1) {
          const variante = variantes[indice]!;
          let skuVariante: string | null = null;

          for (let tentativa = 0; tentativa < 20; tentativa += 1) {
            const baseSku =
              tentativa === 0 ? novoSku : `${novoSku}-${tentativa + 1}`;
            const candidato = buildVariantSku(baseSku, variante.attributes);
            if (
              !skusReservados.has(candidato) &&
              !(await skuExiste(candidato))
            ) {
              skuVariante = candidato;
              break;
            }
          }

          if (!skuVariante) {
            throw new ErroDuplicacaoProduto(
              "Não foi possível gerar SKUs únicos para as variantes.",
            );
          }
          skusReservados.add(skuVariante);
          variantesComNovosIds.push({
            variante,
            novoId: randomUUID(),
            sku: skuVariante,
          });
        }
        await tx.insert(productVariantTable).values(
          variantesComNovosIds.map(({ variante, novoId, sku }) => ({
            id: novoId,
            productId: novoProdutoId,
            sku,
            name: variante.name,
            attributes: variante.attributes,
            priceInCents: variante.priceInCents,
            comparePriceInCents: variante.comparePriceInCents,
            costPriceInCents: variante.costPriceInCents,
            stockQuantity: variante.stockQuantity,
            weightInGrams: variante.weightInGrams,
            lengthInCm: variante.lengthInCm,
            widthInCm: variante.widthInCm,
            heightInCm: variante.heightInCm,
            aceitaPagamentoNaEntrega: variante.aceitaPagamentoNaEntrega,
            isActive: variante.isActive,
            isDefault: variante.isDefault,
            imageUrl: variante.imageUrl,
            createdAt: agora,
            updatedAt: agora,
          })),
        );

        variantesComNovosIds.forEach(({ variante, novoId }) => {
          varianteNovaPorAntiga.set(variante.id, novoId);
        });
      }

      const idsVariantesAntigas = [...varianteNovaPorAntiga.keys()];
      if (idsVariantesAntigas.length > 0) {
        const imagens = await tx
          .select()
          .from(productImageTable)
          .where(
            inArray(productImageTable.productVariantId, idsVariantesAntigas),
          );
        if (imagens.length > 0) {
          await tx.insert(productImageTable).values(
            imagens.map((imagem) => ({
              productVariantId: varianteNovaPorAntiga.get(
                imagem.productVariantId,
              )!,
              imageUrl: imagem.imageUrl,
              externalImageId: null,
              sortOrder: imagem.sortOrder,
              altText: imagem.altText,
              createdAt: agora,
            })),
          );
        }

        const imagensVariantes = await tx
          .select()
          .from(productVariantImageTable)
          .where(
            inArray(productVariantImageTable.variantId, idsVariantesAntigas),
          );
        if (imagensVariantes.length > 0) {
          await tx.insert(productVariantImageTable).values(
            imagensVariantes.map((imagem) => ({
              variantId: varianteNovaPorAntiga.get(imagem.variantId)!,
              imageUrl: imagem.imageUrl,
              altText: imagem.altText,
              sortOrder: imagem.sortOrder,
              createdAt: agora,
            })),
          );
        }

        const classificacoesVariantes = await tx
          .select()
          .from(variantesTiposLogisticosTable)
          .where(
            inArray(
              variantesTiposLogisticosTable.varianteId,
              idsVariantesAntigas,
            ),
          );
        if (classificacoesVariantes.length > 0) {
          await tx.insert(variantesTiposLogisticosTable).values(
            classificacoesVariantes.map((vinculo) => ({
              varianteId: varianteNovaPorAntiga.get(vinculo.varianteId)!,
              tipoLogisticoId: vinculo.tipoLogisticoId,
              createdAt: agora,
              updatedAt: agora,
            })),
          );
        }
      }

      const classificacoesProduto = await tx
        .select()
        .from(produtosTiposLogisticosTable)
        .where(eq(produtosTiposLogisticosTable.produtoId, produtoOriginal.id));
      if (classificacoesProduto.length > 0) {
        await tx.insert(produtosTiposLogisticosTable).values(
          classificacoesProduto.map((vinculo) => ({
            produtoId: novoProdutoId,
            tipoLogisticoId: vinculo.tipoLogisticoId,
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }

      const precosEntrega = await tx
        .select()
        .from(productOwnDeliveryPrices)
        .where(eq(productOwnDeliveryPrices.productId, produtoOriginal.id));
      if (precosEntrega.length > 0) {
        await tx.insert(productOwnDeliveryPrices).values(
          precosEntrega.map((preco) => ({
            productId: novoProdutoId,
            destinationType: preco.destinationType,
            regionId: preco.regionId,
            bairroAvulsoId: preco.bairroAvulsoId,
            cepEspecificoId: preco.cepEspecificoId,
            shippingPrice: preco.shippingPrice,
            deliveryDeadline: preco.deliveryDeadline,
            scheduledDeliveryActive: preco.scheduledDeliveryActive,
            scheduledDeliveryMinDays: preco.scheduledDeliveryMinDays,
            scheduledDeliveryPrice: preco.scheduledDeliveryPrice,
            isActive: preco.isActive,
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }

      const metodosEntrega = await tx
        .select()
        .from(productDeliveryMethodsTable)
        .where(eq(productDeliveryMethodsTable.productId, produtoOriginal.id));
      if (metodosEntrega.length > 0) {
        await tx.insert(productDeliveryMethodsTable).values(
          metodosEntrega.map((metodo) => ({
            productId: novoProdutoId,
            deliveryMethodId: metodo.deliveryMethodId,
            isActive: metodo.isActive,
            customPrice: metodo.customPrice,
            createdAt: agora,
          })),
        );
      }

      const fornecedores = await tx
        .select()
        .from(productSuppliersTable)
        .where(eq(productSuppliersTable.productId, produtoOriginal.id));
      if (fornecedores.length > 0) {
        await tx.insert(productSuppliersTable).values(
          fornecedores.map((fornecedor) => ({
            productId: novoProdutoId,
            supplierId: fornecedor.supplierId,
            isActive: fornecedor.isActive,
            rules: fornecedor.rules,
            createdAt: agora,
          })),
        );
      }

      const regrasFrete = await tx
        .select()
        .from(regrasProdutosFreteTable)
        .where(eq(regrasProdutosFreteTable.produtoId, produtoOriginal.id));
      if (regrasFrete.length > 0) {
        await tx.insert(regrasProdutosFreteTable).values(
          regrasFrete.map((regra) => ({
            produtoId: novoProdutoId,
            efeito: regra.efeito,
            provedorFreteId: regra.provedorFreteId,
            transportadoraFreteId: regra.transportadoraFreteId,
            servicoFreteId: regra.servicoFreteId,
            ativo: regra.ativo,
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }

      return produtoCriado;
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${novoProduto.id}/edit`);
    return { sucesso: true as const, produtoId: novoProduto.id };
  } catch (erro) {
    const mensagem =
      erro instanceof ErroDuplicacaoProduto
        ? erro.message
        : "Não foi possível duplicar o produto.";
    console.error("[duplicarProdutoAdmin] Falha ao duplicar produto", {
      produtoId: idValidado.data,
      tipo: erro instanceof Error ? erro.constructor.name : "ErroDesconhecido",
    });
    return { sucesso: false as const, erro: mensagem };
  }
}
