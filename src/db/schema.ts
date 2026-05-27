// src/db/schema.ts

import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================
// IMPORTS DAS TABELAS EXISTENTES
// ============================================

import { categoryTable } from "./table/categories/categories";
import { productVariantTable } from "./table/products/product-variants";
import { productTable } from "./table/products/products";
import { productImageTable } from "./table/products/product-images";
import { productPricingTable } from "./table/products/product-pricing";
import { productAttributeTable } from "./table/products/product-attributes";
import { productVariantImageTable } from "./table/products/variant-images";
import { productGalleryImagesTable } from "./table/products/product-gallery-images";
import {
  clienteTipoPessoaEnum,
  enderecosClientesRelations,
  enderecosClientesTable,
  perfisClientesRelations,
  perfisClientesTable,
  userTable,
} from "./tables/autenticacao";

// ============================================
// IMPORTS DAS TABELAS DE LOGÍSTICA (NOVOS)
// ============================================

// Regiões (Estados, Cidades, Bairros)
import { states } from "./table/logistics/states/states";
import { cities } from "./table/logistics/cities/cities";
import { neighborhoods } from "./table/logistics/neighborhoods/neighborhoods";

// Modalidades e Fornecedores
import { deliveryMethods } from "./table/logistics/deliveryMethods/deliveryMethods";
import { suppliers } from "./table/logistics/suppliers/suppliers";

// Tabelas de junção (Produto ↔ Logística)
import { productDeliveryMethodsTable } from "./table/logistics/productDeliveryMethods.ts/productDeliveryMethods";
import { productSuppliersTable } from "./table/logistics/productSuppliers/productSuppliers";

// Entrega Própria - Sistema de 3 níveis
import {
  shippingRegions,
  regioBairros,
  shippingRegionCepRanges,
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegionSlots,
  shippingBairroAvulsoSlots,
  shippingPendingNeighborhoods,
  shippingRegionsRelations,
  regioBairrosRelations,
  shippingRegionCepRangesRelations,
  bairrosAvulsosRelations,
  shippingRegionSlotsRelations,
  shippingBairroAvulsoSlotsRelations,
  productOwnDeliveryPrices,
  productOwnDeliveryPricesRelations,
  shippingZipAddresses,
  shippingZipAddressesRelations,
} from "./table/logistics/entrega-propria";

// Retirada - Modelos de retirada
// import { modelosRetiradaTable } from "./table/retirada";
import {
  configHorarioTable,
  feriadosTable,
  modelosRetiradaTable,
  configHorarioRelations,
  feriadosRelations,
} from "./table/retirada";

// ============================================
// TABELAS EXISTENTES (mantidas como estavam)
// ============================================

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const accountTable = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const shippingAddressTable = pgTable("shipping_address", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  recipientName: text().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  complement: text(),
  city: text().notNull(),
  state: text().notNull(),
  neighborhood: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull(),
  phone: text().notNull(),
  email: text().notNull(),
  cpfOrCnpj: text().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartTable = pgTable("cart", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id").references(
    () => shippingAddressTable.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartItemTable = pgTable("cart_item", {
  id: uuid().primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => cartTable.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
]);

export const orderTable = pgTable("order", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id")
    .notNull()
    .references(() => shippingAddressTable.id, { onDelete: "set null" }),
  recipientName: text().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  complement: text(),
  city: text().notNull(),
  state: text().notNull(),
  neighborhood: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull(),
  phone: text().notNull(),
  email: text().notNull(),
  cpfOrCnpj: text().notNull(),
  totalPriceInCents: integer("total_price_in_cents").notNull(),
  status: orderStatus().notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemTable = pgTable("order_item", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orderTable.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// RELAÇÕES EXISTENTES (mantidas como estavam)
// ============================================

export const userRelations = relations(userTable, ({ many, one }) => ({
  shippingAddresses: many(shippingAddressTable),
  perfilCliente: one(perfisClientesTable, {
    fields: [userTable.id],
    references: [perfisClientesTable.userId],
  }),
  enderecosCliente: many(enderecosClientesTable),
  cart: one(cartTable, {
    fields: [userTable.id],
    references: [cartTable.userId],
  }),
  orders: many(orderTable),
}));

export const categoryRelations = relations(categoryTable, ({ many, one }) => ({
  products: many(productTable),
  parent: one(categoryTable, {
    fields: [categoryTable.parentId],
    references: [categoryTable.id],
    relationName: "categoryParent",
  }),
  children: many(categoryTable, {
    relationName: "categoryChildren",
  }),
}));

export const productAttributeRelations = relations(
  productAttributeTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productAttributeTable.productId],
      references: [productTable.id],
    }),
  }),
);

export const productImageRelations = relations(
  productImageTable,
  ({ one }) => ({
    productVariant: one(productVariantTable, {
      fields: [productImageTable.productVariantId],
      references: [productVariantTable.id],
    }),
  }),
);

export const productVariantImageRelations = relations(
  productVariantImageTable,
  ({ one }) => ({
    variant: one(productVariantTable, {
      fields: [productVariantImageTable.variantId],
      references: [productVariantTable.id],
    }),
  }),
);

export const productVariantRelations = relations(
  productVariantTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productVariantTable.productId],
      references: [productTable.id],
    }),
    images: many(productImageTable),
    variantImages: many(productVariantImageTable),
    cartItems: many(cartItemTable),
    orderItems: many(orderItemTable),
  }),
);

// ============================================
// RELAÇÕES DE PRODUTOS (ATUALIZADA COM LOGÍSTICA)
// ============================================

export const productRelations = relations(productTable, ({ one, many }) => ({
  category: one(categoryTable, {
    fields: [productTable.categoryId],
    references: [categoryTable.id],
  }),
  variants: many(productVariantTable),
  attributes: many(productAttributeTable),
  pricing: many(productPricingTable),
  galleryImages: many(productGalleryImagesTable),

  // NOVOS: Relações de logística
  deliveryMethods: many(productDeliveryMethodsTable),
  suppliers: many(productSuppliersTable),

  // Retirada local
  modeloRetirada: one(modelosRetiradaTable, {
    fields: [productTable.modeloRetiradaId],
    references: [modelosRetiradaTable.id],
  }),
}));

export const shippingAddressRelations = relations(
  shippingAddressTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [shippingAddressTable.userId],
      references: [userTable.id],
    }),
    cart: one(cartTable, {
      fields: [shippingAddressTable.id],
      references: [cartTable.shippingAddressId],
    }),
    orders: many(orderTable),
  }),
);

export const cartRelations = relations(cartTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [cartTable.userId],
    references: [userTable.id],
  }),
  shippingAddress: one(shippingAddressTable, {
    fields: [cartTable.shippingAddressId],
    references: [shippingAddressTable.id],
  }),
  items: many(cartItemTable),
}));

export const cartItemRelations = relations(cartItemTable, ({ one }) => ({
  cart: one(cartTable, {
    fields: [cartItemTable.cartId],
    references: [cartTable.id],
  }),
  productVariant: one(productVariantTable, {
    fields: [cartItemTable.productVariantId],
    references: [productVariantTable.id],
  }),
}));

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [orderTable.userId],
    references: [userTable.id],
  }),
  shippingAddress: one(shippingAddressTable, {
    fields: [orderTable.shippingAddressId],
    references: [shippingAddressTable.id],
  }),
  items: many(orderItemTable),
}));

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemTable.orderId],
    references: [orderTable.id],
  }),
  productVariant: one(productVariantTable, {
    fields: [orderItemTable.productVariantId],
    references: [productVariantTable.id],
  }),
}));

export const productPricingRelations = relations(
  productPricingTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productPricingTable.productId],
      references: [productTable.id],
    }),
  }),
);

export const productGalleryImagesRelations = relations(
  productGalleryImagesTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productGalleryImagesTable.productId],
      references: [productTable.id],
    }),
  }),
);

// ============================================
// NOVAS RELAÇÕES DE LOGÍSTICA
// ============================================

/**
 * Relações de Estados
 * Um estado tem muitas cidades
 */
export const statesRelations = relations(states, ({ many }) => ({
  cities: many(cities),
}));

/**
 * Relações de Cidades
 * Uma cidade pertence a um estado e tem muitos bairros
 */
export const citiesRelations = relations(cities, ({ one, many }) => ({
  state: one(states, {
    fields: [cities.stateUf],
    references: [states.uf],
  }),
  neighborhoods: many(neighborhoods),
}));

/**
 * Relações de Bairros
 * Um bairro pertence a uma cidade
 */
export const neighborhoodsRelations = relations(neighborhoods, ({ one }) => ({
  city: one(cities, {
    fields: [neighborhoods.cityId],
    references: [cities.id],
  }),
}));

/**
 * Relações de Modalidades de Entrega
 * Uma modalidade pode estar em muitos produtos
 */
export const deliveryMethodsRelations = relations(
  deliveryMethods,
  ({ many }) => ({
    productLinks: many(productDeliveryMethodsTable),
  }),
);

/**
 * Relações de Fornecedores
 * Um fornecedor pode ter muitos produtos
 */
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  productLinks: many(productSuppliersTable),
}));

/**
 * Relações de Produto ↔ Modalidades (tabela de junção)
 */
export const productDeliveryMethodsRelations = relations(
  productDeliveryMethodsTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productDeliveryMethodsTable.productId],
      references: [productTable.id],
    }),
    deliveryMethod: one(deliveryMethods, {
      fields: [productDeliveryMethodsTable.deliveryMethodId],
      references: [deliveryMethods.id],
    }),
  }),
);

/**
 * Relações de Produto ↔ Fornecedores (tabela de junção)
 */
export const productSuppliersRelations = relations(
  productSuppliersTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productSuppliersTable.productId],
      references: [productTable.id],
    }),
    supplier: one(suppliers, {
      fields: [productSuppliersTable.supplierId],
      references: [suppliers.id],
    }),
  }),
);

// ============================================
// RE-EXPORTAR TODAS AS TABELAS PARA O SCHEMA
// ============================================

// Tabelas existentes
export {
  clienteTipoPessoaEnum,
  enderecosClientesRelations,
  enderecosClientesTable,
  perfisClientesRelations,
  perfisClientesTable,
  userTable,
} from "./tables/autenticacao";
export { categoryTable } from "./table/categories/categories";
export { productTable } from "./table/products/products";
export { productVariantTable } from "./table/products/product-variants";
export { productImageTable } from "./table/products/product-images";
export { productPricingTable } from "./table/products/product-pricing";
export { productAttributeTable } from "./table/products/product-attributes";
export { productVariantImageTable } from "./table/products/variant-images";
export { productGalleryImagesTable } from "./table/products/product-gallery-images";

// Tabelas de logística
export { states } from "./table/logistics/states/states";
export { cities } from "./table/logistics/cities/cities";
export { neighborhoods } from "./table/logistics/neighborhoods/neighborhoods";
export { deliveryMethods } from "./table/logistics/deliveryMethods/deliveryMethods";
export { suppliers } from "./table/logistics/suppliers/suppliers";
export { productDeliveryMethodsTable } from "./table/logistics/productDeliveryMethods.ts/productDeliveryMethods";
export { productSuppliersTable } from "./table/logistics/productSuppliers/productSuppliers";

// Shipping - Novo sistema 3 níveis (NOVO)
export {
  shippingRegions,
  regioBairros,
  shippingRegionCepRanges,
  bairrosAvulsos,
  cepsEspecificos,
  shippingRegionSlots,
  shippingBairroAvulsoSlots,
  shippingPendingNeighborhoods,
  shippingZipAddresses,
  productOwnDeliveryPrices,
  type ShippingRegion,
  type NewShippingRegion,
  type RegioBairro,
  type NewRegioBairro,
  type ShippingRegionCepRange,
  type NewShippingRegionCepRange,
  type BairroAvulso,
  type NewBairroAvulso,
  type CepEspecifico,
  type NewCepEspecifico,
  type ShippingRegionSlot,
  type NewShippingRegionSlot,
  type ShippingBairroAvulsoSlot,
  type NewShippingBairroAvulsoSlot,
  type ShippingPendingNeighborhood,
  type NewShippingPendingNeighborhood,
  type ShippingZipAddress,
  type NewShippingZipAddress,
  type ProductOwnDeliveryPrice,
  type NewProductOwnDeliveryPrice,
} from "./table/logistics/entrega-propria";

// Tabelas de Retirada
export {
  configHorarioTable,
  feriadosTable,
  modelosRetiradaTable,
} from "./table/retirada";

// Checkout visitante, pedidos e pagamentos
export {
  checkoutClientesRelations,
  checkoutClientesTable,
  checkoutEfiWebhookEventosRelations,
  checkoutEfiWebhookEventosTable,
  checkoutEnderecosRelations,
  checkoutEnderecosTable,
  checkoutPagamentoGatewayEnum,
  checkoutPagamentoMetodoEnum,
  checkoutPagamentoStatusEnum,
  checkoutPedidoHistoricoOrigemEnum,
  checkoutPedidoHistoricoTipoEnum,
  checkoutPedidoHistoricosRelations,
  checkoutPedidoHistoricosTable,
  checkoutPagamentosRelations,
  checkoutPagamentosTable,
  checkoutPedidoItensRelations,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasRelations,
  checkoutPedidoLogisticasTable,
  checkoutStripeWebhookEventosRelations,
  checkoutStripeWebhookEventosTable,
  checkoutPedidosRelations,
  checkoutPedidosTable,
  checkoutPedidoStatusEnum,
} from "./tables/checkout";

// Precificação e regras comerciais
export {
  configuracoesPagamentoRelations,
  configuracoesPagamentoTable,
  precificacaoAlvoRegraPromocionalEnum,
  precificacaoTipoRegraPromocionalEnum,
  regrasPromocionaisRelations,
  regrasPromocionaisTable,
} from "./tables/precificacao";

// Regras profissionais de disponibilidade de frete
export {
  produtosTiposLogisticosRelations,
  produtosTiposLogisticosTable,
  provedoresFreteRelations,
  provedoresFreteTable,
  regrasCategoriasFreteRelations,
  regrasCategoriasFreteTable,
  regrasProdutosFreteRelations,
  regrasProdutosFreteTable,
  regrasTiposLogisticosFreteRelations,
  regrasTiposLogisticosFreteTable,
  servicosFreteRelations,
  servicosFreteTable,
  tiposLogisticosRelations,
  tiposLogisticosTable,
  transportadorasFreteRelations,
  transportadorasFreteTable,
  variantesTiposLogisticosRelations,
  variantesTiposLogisticosTable,
} from "./tables/logistica";

// Relations de Shipping
export {
  shippingRegionsRelations,
  regioBairrosRelations,
  shippingRegionCepRangesRelations,
  bairrosAvulsosRelations,
  shippingRegionSlotsRelations,
  shippingBairroAvulsoSlotsRelations,
  productOwnDeliveryPricesRelations,
  shippingZipAddressesRelations,
} from "./table/logistics/entrega-propria";

// ============================================
// NOVAS RELAÇÕES DE RETIRADA
// ============================================

export const configHorarioRelationsRetirada = relations(
  configHorarioTable,
  ({ many }) => ({
    Holidays: many(feriadosTable),
  }),
);

export const feriadosRelationsRetirada = relations(
  feriadosTable,
  ({ many }) => ({
    // Relações de feriados
  }),
);
