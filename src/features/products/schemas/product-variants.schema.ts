import { z } from "zod";

export const productKindSchema = z.enum(["simple", "variable"]);

export const productAttributeSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  name: z.string().trim().min(1),
  values: z.array(z.string().trim().min(1)).default([]),
});

export const productVariantAttributesSchema = z.record(
  z.string().trim().min(1),
  z.string().trim().min(1),
);

export const productVariantSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  sku: z.string().trim().min(1),
  name: z.string().trim().optional().nullable(),
  attributes: productVariantAttributesSchema.default({}),
  priceInCents: z.coerce.number().int().min(0),
  comparePriceInCents: z.coerce.number().int().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  weightInGrams: z.coerce.number().int().min(0).optional().nullable(),
  heightInCm: z.coerce.number().int().min(0).optional().nullable(),
  widthInCm: z.coerce.number().int().min(0).optional().nullable(),
  lengthInCm: z.coerce.number().int().min(0).optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const productVariantsPayloadSchema = z.object({
  productKind: productKindSchema.default("simple"),
  attributes: z.array(productAttributeSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});
