// src/db/schema.ts

import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================
// IMPORTS DAS TABELAS EXISTENTES
// ============================================
import { categoryTable } from "./table/categories/categories";
import { categoryFaqTable } from "./table/categories/category-faq";
import { cities } from "./table/logistics/cities/cities";
// Modalidades e Fornecedores
import { deliveryMethods } from "./table/logistics/deliveryMethods/deliveryMethods";
// Entrega Própria - Sistema de 3 níveis
import {
  bairrosAvulsos,
  bairrosAvulsosRelations,
  cepsEspecificos,
  productOwnDeliveryPrices,
  productOwnDeliveryPricesRelations,
  regioBairros,
  regioBairrosRelations,
  shippingBairroAvulsoSlots,
  shippingBairroAvulsoSlotsRelations,
  shippingPendingNeighborhoods,
  shippingRegionCepRanges,
  shippingRegionCepRangesRelations,
  shippingRegions,
  shippingRegionSlots,
  shippingRegionSlotsRelations,
  shippingRegionsRelations,
  shippingZipAddresses,
  shippingZipAddressesRelations,
} from "./table/logistics/entrega-propria";
import { neighborhoods } from "./table/logistics/neighborhoods/neighborhoods";
// Tabelas de junção (Produto ↔ Logística)
import { productDeliveryMethodsTable } from "./table/logistics/productDeliveryMethods.ts/productDeliveryMethods";
import { productSuppliersTable } from "./table/logistics/productSuppliers/productSuppliers";
// ============================================
// IMPORTS DAS TABELAS DE LOGÍSTICA (NOVOS)
// ============================================
// Regiões (Estados, Cidades, Bairros)
import { states } from "./table/logistics/states/states";
import { suppliers } from "./table/logistics/suppliers/suppliers";
import { marcaTable } from "./table/marcas/marcas";
import { identificadoresCatalogoTable } from "./table/products/identificadores-catalogo";
import { productAttributeTable } from "./table/products/product-attributes";
import { productGalleryImagesTable } from "./table/products/product-gallery-images";
import { productImageTable } from "./table/products/product-images";
import { productPricingTable } from "./table/products/product-pricing";
import { productVariantTable } from "./table/products/product-variants";
import { productTable } from "./table/products/products";
import { produtosVendaCruzadaTable } from "./table/products/produtos-venda-cruzada";
import { productVariantImageTable } from "./table/products/variant-images";
// Retirada - Modelos de retirada
// import { modelosRetiradaTable } from "./table/retirada";
import {
  configHorarioRelations,
  configHorarioTable,
  feriadosRelations,
  feriadosTable,
  modelosRetiradaTable,
} from "./table/retirada";
import {
  clienteTipoPessoaEnum,
  enderecosClientesRelations,
  enderecosClientesTable,
  perfisClientesRelations,
  perfisClientesTable,
  userTable,
} from "./tables/autenticacao";
import { fornecedoresTable as fornecedoresIdentificadoresTable } from "./tables/fornecedores/tabelas/fornecedores";

// ============================================
// TABELAS EXISTENTES (mantidas como estavam)
// ============================================

export const sessionTable = pgTable(
  "session",
  {
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
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const accountTable = pgTable(
  "account",
  {
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
  },
  (table) => [
    // Na versão 1.3.34, Better Auth resolve uma identidade externa pelo par
    // providerId + accountId. A constraint impede dois users de reivindicarem
    // a mesma conta do provedor em uma corrida de gravação.
    uniqueIndex("account_provider_id_account_id_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verificationTable = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

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
  faqs: many(categoryFaqTable),
  parent: one(categoryTable, {
    fields: [categoryTable.parentId],
    references: [categoryTable.id],
    relationName: "categoryParent",
  }),
  children: many(categoryTable, {
    relationName: "categoryChildren",
  }),
}));

export const categoryFaqRelations = relations(categoryFaqTable, ({ one }) => ({
  category: one(categoryTable, {
    fields: [categoryFaqTable.categoryId],
    references: [categoryTable.id],
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
    identificadoresCatalogo: many(identificadoresCatalogoTable),
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
  marca: one(marcaTable, {
    fields: [productTable.marcaId],
    references: [marcaTable.id],
  }),
  variants: many(productVariantTable),
  attributes: many(productAttributeTable),
  pricing: many(productPricingTable),
  galleryImages: many(productGalleryImagesTable),
  identificadoresCatalogo: many(identificadoresCatalogoTable),
  vendasCruzadasConfiguradas: many(produtosVendaCruzadaTable, {
    relationName: "vendaCruzadaProdutoPrincipal",
  }),
  vendasCruzadasEmQueAparece: many(produtosVendaCruzadaTable, {
    relationName: "vendaCruzadaProdutoOferecido",
  }),

  // NOVOS: Relações de logística
  deliveryMethods: many(productDeliveryMethodsTable),
  suppliers: many(productSuppliersTable),

  // Retirada local
  modeloRetirada: one(modelosRetiradaTable, {
    fields: [productTable.modeloRetiradaId],
    references: [modelosRetiradaTable.id],
  }),
}));

export const produtosVendaCruzadaRelations = relations(
  produtosVendaCruzadaTable,
  ({ one }) => ({
    produtoPrincipal: one(productTable, {
      fields: [produtosVendaCruzadaTable.produtoPrincipalId],
      references: [productTable.id],
      relationName: "vendaCruzadaProdutoPrincipal",
    }),
    produtoOferecido: one(productTable, {
      fields: [produtosVendaCruzadaTable.produtoOferecidoId],
      references: [productTable.id],
      relationName: "vendaCruzadaProdutoOferecido",
    }),
  }),
);

export { produtosVendaCruzadaTable };

export const marcaRelations = relations(marcaTable, ({ many }) => ({
  produtos: many(productTable),
  identificadoresCatalogo: many(identificadoresCatalogoTable),
}));

export const identificadoresCatalogoRelations = relations(
  identificadoresCatalogoTable,
  ({ one }) => ({
    produto: one(productTable, {
      fields: [identificadoresCatalogoTable.produtoId],
      references: [productTable.id],
    }),
    variante: one(productVariantTable, {
      fields: [identificadoresCatalogoTable.varianteId],
      references: [productVariantTable.id],
    }),
    marca: one(marcaTable, {
      fields: [identificadoresCatalogoTable.marcaId],
      references: [marcaTable.id],
    }),
    fornecedor: one(fornecedoresIdentificadoresTable, {
      fields: [identificadoresCatalogoTable.fornecedorId],
      references: [fornecedoresIdentificadoresTable.id],
    }),
  }),
);

export {
  type IdentificadorCatalogo,
  identificadorCatalogoGtinTipoEnum,
  identificadorCatalogoOrigemEnum,
  identificadorCatalogoStatusEnum,
  identificadorCatalogoTipoEnum,
  identificadoresCatalogoTable,
  type NovoIdentificadorCatalogo,
} from "./table/products/identificadores-catalogo";

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
export { categoryTable } from "./table/categories/categories";
export { categoryFaqTable } from "./table/categories/category-faq";
export { marcaTable } from "./table/marcas/marcas";
export { productAttributeTable } from "./table/products/product-attributes";
export { productGalleryImagesTable } from "./table/products/product-gallery-images";
export { productImageTable } from "./table/products/product-images";
export { productPricingTable } from "./table/products/product-pricing";
export { productVariantTable } from "./table/products/product-variants";
export { productTable } from "./table/products/products";
export { productVariantImageTable } from "./table/products/variant-images";
export {
  clienteTipoPessoaEnum,
  enderecosClientesRelations,
  enderecosClientesTable,
  perfisClientesRelations,
  perfisClientesTable,
  userTable,
} from "./tables/autenticacao";
export {
  desafiosOtpTelefoneTable,
  emissoesOtpTelefoneTable,
} from "./tables/autenticacao";
export {
  type BannerHome,
  bannerHomeDestaqueEnum,
  bannerHomePosicaoEnum,
  bannerHomeTipoEnum,
  bannersHomeTable,
  type NovoBannerHome,
} from "./tables/banners-home";
export {
  type ConfiguracaoLoja,
  configuracoesLojaTable,
} from "./tables/configuracoes-loja/tabelas/configuracoes-loja";

// Tabelas de logística
export { cities } from "./table/logistics/cities/cities";
export { deliveryMethods } from "./table/logistics/deliveryMethods/deliveryMethods";
export { neighborhoods } from "./table/logistics/neighborhoods/neighborhoods";
export { productDeliveryMethodsTable } from "./table/logistics/productDeliveryMethods.ts/productDeliveryMethods";
export { productSuppliersTable } from "./table/logistics/productSuppliers/productSuppliers";
export { states } from "./table/logistics/states/states";
export { suppliers } from "./table/logistics/suppliers/suppliers";

// Shipping - Novo sistema 3 níveis (NOVO)
export {
  type BairroAvulso,
  bairrosAvulsos,
  type CepEspecifico,
  cepsEspecificos,
  type NewBairroAvulso,
  type NewCepEspecifico,
  type NewProductOwnDeliveryPrice,
  type NewRegioBairro,
  type NewShippingBairroAvulsoSlot,
  type NewShippingPendingNeighborhood,
  type NewShippingRegion,
  type NewShippingRegionCepRange,
  type NewShippingRegionSlot,
  type NewShippingZipAddress,
  type ProductOwnDeliveryPrice,
  productOwnDeliveryPrices,
  type RegioBairro,
  regioBairros,
  type ShippingBairroAvulsoSlot,
  shippingBairroAvulsoSlots,
  type ShippingPendingNeighborhood,
  shippingPendingNeighborhoods,
  type ShippingRegion,
  type ShippingRegionCepRange,
  shippingRegionCepRanges,
  shippingRegions,
  type ShippingRegionSlot,
  shippingRegionSlots,
  type ShippingZipAddress,
  shippingZipAddresses,
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
  checkoutPagamentoNaEntregaFormaEnum,
  checkoutPagamentosRelations,
  checkoutPagamentosTable,
  checkoutPagamentoStatusEnum,
  checkoutPedidoHistoricoOrigemEnum,
  checkoutPedidoHistoricosRelations,
  checkoutPedidoHistoricosTable,
  checkoutPedidoHistoricoTipoEnum,
  checkoutPedidoItensRelations,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasRelations,
  checkoutPedidoLogisticasTable,
  checkoutPedidoPagamentoEntregaRelations,
  checkoutPedidoPagamentoEntregaTable,
  checkoutPedidosRelations,
  checkoutPedidosTable,
  checkoutPedidoStatusEnum,
  checkoutStripeWebhookEventosRelations,
  checkoutStripeWebhookEventosTable,
  type SnapshotElegibilidadePagamentoNaEntrega,
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

// Fornecedores e importações
export {
  type Fornecedor,
  fornecedoresRelations,
  fornecedoresTable,
  type FornecedorIntegracaoApi,
  fornecedorIntegracaoApiAmbienteEnum,
  fornecedorIntegracaoApiProvedorEnum,
  fornecedorIntegracaoApiTesteStatusEnum,
  type FornecedorIntegracaoLog,
  fornecedorIntegracaoLogsRelations,
  fornecedorIntegracaoLogsTable,
  fornecedorIntegracaoLogStatusEnum,
  fornecedorIntegracoesApiRelations,
  fornecedorIntegracoesApiTable,
  type FornecedorMapeamentoColuna,
  fornecedorMapeamentoColunaDestinoEnum,
  fornecedorMapeamentosColunasRelations,
  fornecedorMapeamentosColunasTable,
  type FornecedorPedidoIntegracao,
  fornecedorPedidoIntegracoesTable,
  fornecedorPrecoOrigemAjusteEnum,
  type FornecedorProdutoApiStaging,
  fornecedorProdutoApiStagingStatusEnum,
  fornecedorProdutosApiStagingRelations,
  fornecedorProdutosApiStagingTable,
  fornecedorProdutosStagingRelations,
  fornecedorProdutosStagingTable,
  type FornecedorProdutoStaging,
  fornecedorProdutoStagingStatusEnum,
  type FornecedorProdutoVinculo,
  fornecedorProdutoVinculosRelations,
  fornecedorProdutoVinculosTable,
  fornecedorProdutoVinculoStatusEnum,
  fornecedorProdutoVinculoTipoEnum,
  fornecedorStatusEnum,
  fornecedorTipoIntegracaoEnum,
  type ImportacaoFornecedor,
  type ImportacaoFornecedorAjuste,
  importacaoFornecedorAjusteEscopoEnum,
  importacaoFornecedorAjustesRelations,
  importacaoFornecedorAjustesTable,
  importacaoFornecedorAjusteStatusEnum,
  importacaoFornecedorAjusteTipoEnum,
  importacaoFornecedorStatusEnum,
  importacaoFornecedorTipoArquivoEnum,
  importacoesFornecedorRelations,
  importacoesFornecedorTable,
  type NovaFornecedorIntegracaoApi,
  type NovaFornecedorIntegracaoLog,
  type NovaFornecedorPedidoIntegracao,
  type NovaImportacaoFornecedor,
  type NovaImportacaoFornecedorAjuste,
  type NovoFornecedor,
  type NovoFornecedorMapeamentoColuna,
  type NovoFornecedorProdutoApiStaging,
  type NovoFornecedorProdutoStaging,
  type NovoFornecedorProdutoVinculo,
  type NovoProdutoRascunho,
  type ProdutoRascunho,
  produtoRascunhoOrigemTipoEnum,
  produtoRascunhosRelations,
  produtoRascunhosTable,
  produtoRascunhoStatusEnum,
  type StatusFornecedorPedidoIntegracao,
} from "./tables/fornecedores";

// Motor de promoções
export {
  type CupomPromocao,
  cuponsPromocaoRelations,
  cuponsPromocaoTable,
  type NovaRegraPromocao,
  type NovaRegraPromocaoCategoria,
  type NovaRegraPromocaoFreteGratis,
  type NovaRegraPromocaoMarca,
  type NovaRegraPromocaoProduto,
  type NovaRegraPromocaoSubtotal,
  type NovoCupomPromocao,
  type NovoUsoCupomPromocao,
  promocaoStatusEnum,
  promocaoTipoBeneficioEnum,
  promocaoTipoCampanhaEnum,
  promocaoTipoDescontoEnum,
  type RegraPromocao,
  type RegraPromocaoCategoria,
  type RegraPromocaoFreteGratis,
  type RegraPromocaoMarca,
  type RegraPromocaoProduto,
  type RegraPromocaoSubtotal,
  regrasPromocaoCategoriasRelations,
  regrasPromocaoCategoriasTable,
  regrasPromocaoFretesGratisRelations,
  regrasPromocaoFretesGratisTable,
  regrasPromocaoMarcasRelations,
  regrasPromocaoMarcasTable,
  regrasPromocaoProdutosRelations,
  regrasPromocaoProdutosTable,
  regrasPromocaoRelations,
  regrasPromocaoSubtotaisRelations,
  regrasPromocaoSubtotaisTable,
  regrasPromocaoTable,
  type UsoCupomPromocao,
  usosCuponsPromocaoRelations,
  usosCuponsPromocaoTable,
} from "./tables/promocoes";

// Regras profissionais de disponibilidade de frete
export {
  configuracoesPagamentoNaEntregaServicoRelations,
  configuracoesPagamentoNaEntregaServicoTable,
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

// Persistência própria do Atendente IA.
export * from "./tables/atendimento-ia";

// Configurações e overrides do Programa de Fidelidade (sem carteira ou pontos).
export * from "./tables/programa-fidelidade";
export * from "./tables/programa-fidelidade-carteira";

// Páginas institucionais e seus grupos ordenáveis de navegação.
export * from "./tables/paginas-dinamicas";

// Relations de Shipping
export {
  bairrosAvulsosRelations,
  productOwnDeliveryPricesRelations,
  regioBairrosRelations,
  shippingBairroAvulsoSlotsRelations,
  shippingRegionCepRangesRelations,
  shippingRegionSlotsRelations,
  shippingRegionsRelations,
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
