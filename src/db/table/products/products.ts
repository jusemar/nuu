// src/db/table/products/products.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { categoryTable } from "../categories/categories";
import { marcaTable } from "../marcas/marcas";
import { sql } from "drizzle-orm";
import { modelosRetiradaTable } from "../retirada/modelos-retirada";

/**
 * Tabela de produtos
 *
 * Armazena todos os produtos da loja.
 * Campos de logística adicionados para controle de entrega.
 */
export const productTable = pgTable("product", {
  id: uuid().primaryKey().defaultRandom(),

  // Básicos
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categoryTable.id, { onDelete: "set null" }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  cardShortText: text("card_short_text"),
  description: text().notNull(),
  brand: text("brand"),
  marcaId: uuid("marca_id")
    .notNull()
    .references(() => marcaTable.id, {
      onDelete: "restrict",
    }),
  storeProductFlags: text("store_product_flags").array().default([]),

  // Modelo comercial do produto: simples ou com variantes.
  productKind: text("product_kind").notNull().default("simple"),

  // Códigos
  sku: text("sku")
    .notNull()
    .default(sql`gen_random_uuid()`),
  productType: text("product_type"),
  productCode: text("product_code"),
  ncmCode: text("ncm_code"),

  // Status e organização
  status: text("status").default("draft"),
  collection: text("collection"),
  tags: text("tags").array(),

  // Preços
  costPrice: integer("cost_price_in_cents"),
  salePrice: integer("sale_price_in_cents"),
  promoPrice: integer("promo_price_in_cents"),
  taxRate: integer("tax_rate"),

  // Dimensões e frete
  weight: integer("weight_in_grams"),
  length: integer("length_in_cm"),
  width: integer("width_in_cm"),
  height: integer("height_in_cm"),
  hasFreeShipping: boolean("has_free_shipping").default(false),
  hasLocalPickup: boolean("has_local_pickup").default(false),

  // Garantia
  warrantyPeriod: integer("warranty_period_in_days"),
  warrantyProvider: text("warranty_provider"),

  // Vendedor
  sellerCode: text("seller_code"),
  internalCode: text("internal_code"),
  sellerInfo: text("seller_info"),

  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),

  // ============================================
  // NOVOS CAMPOS - CONTROLE DE ENTREGA/LOGÍSTICA
  // ============================================

  /**
   * Quem pode entregar este produto
   * Array de tipos: 'own', 'supplier', 'carrier'
   * Define se produto aceita entrega própria, fornecedor ou transportadora
   */
  allowedDeliveryTypes: text("allowed_delivery_types").array().default(["own"]),

  /**
   * Se produto permite entrega própria (loja)
   * Quando true, cliente pode escolher entrega da loja
   */
  allowsOwnDelivery: boolean("allows_own_delivery").default(true),

  /**
   * Se produto permite drop-shipping (fornecedor entrega)
   * Quando true, fornecedores podem entregar direto
   */
  allowsSupplierDelivery: boolean("allows_supplier_delivery").default(false),

  /**
   * Se produto permite retirada no local
   * Quando true, cliente pode retirar na loja
   */
  allowsPickup: boolean("allows_pickup").default(false),

  // ============================================
  // RETIRADA LOCAL — Modelo e prazo
  // ============================================
  /**
   * Modelo de retirada selecionado para este produto
   * FK → modelos_retirada
   */
  modeloRetiradaId: uuid("modelo_retirada_id").references(
    () => modelosRetiradaTable.id,
    { onDelete: "set null" },
  ),

  /**
   * Prazo personalizado para retirada (sobrescreve o prazo do modelo)
   * Ex: "48h após confirmação do pagamento"
   */
  prazoRetiradaCustom: text("prazo_retirada_custom"),

  /**
   * Se produto requer transportadora obrigatória
   * Para produtos grandes/pesados que só vão por transportadora
   */
  requiresCarrierOnly: boolean("requires_carrier_only").default(false),

  /**
   * Fornecedores preferenciais para este produto
   * Array de IDs de fornecedores (ordem = prioridade)
   * Usado quando allowsSupplierDelivery = true
   */
  preferredSupplierIds: jsonb("preferred_supplier_ids")
    .$type<string[]>()
    .default([]),

  /**
   * Modalidades de entrega permitidas para este produto
   * Array de IDs de modalidades (motoboy, transportadora, etc)
   * Se vazio, usa todas as modalidades ativas
   */
  allowedDeliveryMethodIds: jsonb("allowed_delivery_method_ids")
    .$type<number[]>()
    .default([]),

  /**
   * Prazo de entrega adicional em dias
   * Somado ao prazo da modalidade/fornecedor
   * Ex: produto precisa de 2 dias a mais para separação
   */
  additionalDeliveryDays: integer("additional_delivery_days").default(0),

  // Controle
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
