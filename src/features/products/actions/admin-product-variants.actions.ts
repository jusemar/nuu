"use server";

import { db } from "@/db/connection";
import { productAttributeTable, productVariantTable } from "@/db/schema";
import { eq } from "drizzle-orm";

import {
  productAttributeSchema,
  productVariantSchema,
} from "../schemas/product-variants.schema";
import type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantFormInput,
} from "../types/product-variants.types";
import { normalizeProductKind } from "../lib/product-kind";

type SaveProductVariantsInput = {
  productId: string;
  productKind?: ProductKind | string | null;
  attributes?: ProductAttributeInput[];
  variants?: ProductVariantFormInput[];
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
}: SaveProductVariantsInput) {
  const normalizedKind = normalizeProductKind(productKind);

  await db
    .delete(productAttributeTable)
    .where(eq(productAttributeTable.productId, productId));

  await db
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
    await db.insert(productAttributeTable).values(
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
        isActive: variant.isActive ?? true,
        isDefault: variant.isDefault ?? false,
      }),
    )
    .filter((result) => result.success)
    .map((result) => result.data);

  if (parsedVariants.length > 0) {
    await db.insert(productVariantTable).values(
      parsedVariants.map((variant) => ({
        productId,
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes,
        priceInCents: variant.priceInCents,
        comparePriceInCents: variant.comparePriceInCents,
        stockQuantity: variant.stockQuantity,
        weightInGrams: variant.weightInGrams,
        heightInCm: variant.heightInCm,
        widthInCm: variant.widthInCm,
        lengthInCm: variant.lengthInCm,
        imageUrl: variant.imageUrl,
        isActive: variant.isActive,
        isDefault: variant.isDefault,
        updatedAt: new Date(),
      })),
    );
  }
}
