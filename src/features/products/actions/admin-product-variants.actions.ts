"use server";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  identificadoresCatalogoTable,
  productAttributeTable,
  productVariantTable,
  variantesTiposLogisticosTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { validarGtin, validarMpnBasico } from "../lib/identificadores-catalogo";
import { montarLinhaVarianteParaBanco } from "../lib/montar-linha-variante-para-banco";
import { normalizeProductKind } from "../lib/product-kind";
import {
  productAttributeSchema,
  productVariantSchema,
} from "../schemas/product-variants.schema";
import type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantFormInput,
} from "../types/product-variants.types";
import {
  ErroIdentificadorCatalogo,
  removerIdentificadorManualNaoVerificado,
  salvarIdentificadorCatalogo,
} from "./salvar-identificador-catalogo";

type SaveProductVariantsInput = {
  productId: string;
  productKind?: ProductKind | string | null;
  attributes?: ProductAttributeInput[];
  variants?: ProductVariantFormInput[];
  marcaId?: string | null;
  preservarVarianteTecnicaProdutoSimples?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor?: any;
};

function toIntegerOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function toIntegerOrZero(value: unknown) {
  return toIntegerOrNull(value) ?? 0;
}

export async function salvarEstruturaVariantesProduto({
  productId,
  productKind,
  attributes = [],
  variants = [],
  marcaId,
  preservarVarianteTecnicaProdutoSimples = false,
  executor = db,
}: SaveProductVariantsInput) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  const normalizedKind = normalizeProductKind(productKind);

  // Valida antes do primeiro delete para que um identificador inválido nunca
  // deixe a estrutura de variantes parcialmente recriada.
  for (const variant of variants) {
    if (variant.gtin?.trim() && !validarGtin(variant.gtin).valido) {
      throw new ErroIdentificadorCatalogo(
        `GTIN inválido na variante ${variant.sku || "sem SKU"}.`,
      );
    }
    if (
      variant.mpn?.trim() &&
      !validarMpnBasico({
        valor: variant.mpn,
        declaradoExplicitamente: true,
      }).valido
    ) {
      throw new ErroIdentificadorCatalogo(
        `MPN inválido na variante ${variant.sku || "sem SKU"}.`,
      );
    }
  }

  const variantesAnteriores =
    normalizedKind === "variable"
      ? await executor
          .select({ id: productVariantTable.id, sku: productVariantTable.sku })
          .from(productVariantTable)
          .where(eq(productVariantTable.productId, productId))
      : [];
  const idsAnteriores = variantesAnteriores.map(
    (variante: { id: string }) => variante.id,
  );
  const identificadoresAnteriores = idsAnteriores.length
    ? await executor
        .select()
        .from(identificadoresCatalogoTable)
        .where(inArray(identificadoresCatalogoTable.varianteId, idsAnteriores))
    : [];
  const skuPorIdAnterior = new Map<string, string>(
    variantesAnteriores.map((variante: { id: string; sku: string }) => [
      variante.id,
      variante.sku,
    ]),
  );

  await executor
    .delete(productAttributeTable)
    .where(eq(productAttributeTable.productId, productId));

  if (normalizedKind === "simple" && preservarVarianteTecnicaProdutoSimples) {
    // Edições de um produto já simples mantêm seu registro técnico.
    return;
  }

  await executor
    .delete(productVariantTable)
    .where(eq(productVariantTable.productId, productId));

  if (normalizedKind === "simple") return;

  const parsedAttributes = attributes
    .map((attribute) =>
      productAttributeSchema.safeParse({
        ...attribute,
        values: Array.from(
          new Set((attribute.values || []).map((value) => value.trim())),
        ).filter(Boolean),
      }),
    )
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((attribute) => attribute.values.length > 0);

  if (parsedAttributes.length > 0) {
    await executor.insert(productAttributeTable).values(
      parsedAttributes.map((attribute) => ({
        productId,
        name: attribute.name,
        values: attribute.values,
        updatedAt: new Date(),
      })),
    );
  }

  const parsedVariants = variants
    .filter((variant) => variant.sku?.trim())
    .map((variant) =>
      productVariantSchema.safeParse({
        ...variant,
        sku: variant.sku.trim(),
        name: variant.name?.trim() || null,
        priceInCents: toIntegerOrZero(variant.priceInCents),
        comparePriceInCents: toIntegerOrNull(variant.comparePriceInCents),
        stockQuantity: toIntegerOrZero(variant.stockQuantity),
        weightInGrams: toIntegerOrNull(variant.weightInGrams),
        heightInCm: toIntegerOrNull(variant.heightInCm),
        widthInCm: toIntegerOrNull(variant.widthInCm),
        lengthInCm: toIntegerOrNull(variant.lengthInCm),
        imageUrl: variant.imageUrl?.trim() || null,
        // `?? null` e nunca `?? false`: ausência significa "herda do produto".
        aceitaPagamentoNaEntrega: variant.aceitaPagamentoNaEntrega ?? null,
        isActive: variant.isActive ?? true,
        isDefault: variant.isDefault ?? false,
      }),
    )
    .filter((result) => result.success)
    .map((result) => result.data);

  if (parsedVariants.length > 0) {
    // ⚠️ Salvar variantes é destrutivo: o delete acima apaga todas e a inserção abaixo as
    // recria. Um campo novo precisa entrar em três lugares — `productVariantSchema`, o
    // `safeParse` acima e `montarLinhaVarianteParaBanco`. Faltando no último, o Zod aceita
    // e o valor some sem erro nenhum. O mapeamento foi extraído para uma função pura
    // justamente para ter teste cobrindo isso.
    const agora = new Date();
    const variantesInseridas = await executor
      .insert(productVariantTable)
      .values(
        parsedVariants.map((variant) =>
          montarLinhaVarianteParaBanco(variant, productId, agora),
        ),
      )
      .returning({
        id: productVariantTable.id,
        sku: productVariantTable.sku,
      });

    const varianteIdPorSku = new Map<string, string>(
      variantesInseridas.map((variante: { id: string; sku: string }) => [
        variante.sku,
        variante.id,
      ]),
    );

    // O fluxo legado recria variantes. Reassociamos todos os registros (inclusive
    // conflitos e procedência) pelo SKU antes de aplicar o valor do formulário.
    const identificadoresParaRestaurar = identificadoresAnteriores.flatMap(
      (identificador: typeof identificadoresCatalogoTable.$inferSelect) => {
        const sku = identificador.varianteId
          ? skuPorIdAnterior.get(identificador.varianteId)
          : null;
        const varianteId = sku ? varianteIdPorSku.get(sku) : null;
        if (!varianteId) return [];
        return [
          {
            tipo: identificador.tipo,
            valor: identificador.valor,
            gtinTipo: identificador.gtinTipo,
            produtoId: null,
            varianteId,
            marcaId: identificador.marcaId,
            origem: identificador.origem,
            fornecedorId: identificador.fornecedorId,
            referenciaOrigem: identificador.referenciaOrigem,
            status: identificador.status,
            motivoStatus: identificador.motivoStatus,
            principal: identificador.principal,
            verificadoEm: identificador.verificadoEm,
            createdAt: identificador.createdAt,
            updatedAt: identificador.updatedAt,
          },
        ];
      },
    );
    if (identificadoresParaRestaurar.length) {
      await executor
        .insert(identificadoresCatalogoTable)
        .values(identificadoresParaRestaurar);
    }

    for (const variant of parsedVariants) {
      const varianteId = varianteIdPorSku.get(variant.sku);
      if (!varianteId) continue;
      if (variant.gtin?.trim()) {
        await salvarIdentificadorCatalogo({
          tipo: "gtin",
          valor: variant.gtin,
          varianteId,
          marcaId,
          origem: "manual_admin",
          executor,
        });
      } else {
        await removerIdentificadorManualNaoVerificado({
          tipo: "gtin",
          varianteId,
          executor,
        });
      }
      if (variant.mpn?.trim()) {
        await salvarIdentificadorCatalogo({
          tipo: "mpn",
          valor: variant.mpn,
          varianteId,
          marcaId,
          origem: "manual_admin",
          executor,
        });
      } else {
        await removerIdentificadorManualNaoVerificado({
          tipo: "mpn",
          varianteId,
          executor,
        });
      }
    }
    const vinculosClassificacoes = parsedVariants.flatMap((variant) => {
      const varianteId = varianteIdPorSku.get(variant.sku);
      if (!varianteId) return [];

      return (variant.classificacoesLogisticasIds ?? []).map(
        (tipoLogisticoId) => ({
          varianteId,
          tipoLogisticoId,
          updatedAt: new Date(),
        }),
      );
    });

    if (vinculosClassificacoes.length > 0) {
      await executor
        .insert(variantesTiposLogisticosTable)
        .values(vinculosClassificacoes)
        .onConflictDoNothing();
    }
  }
}
