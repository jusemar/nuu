import {
  pgTable,
  foreignKey,
  unique,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  serial,
  varchar,
  numeric,
  time,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
]);

export const product = pgTable(
  "product",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    categoryId: uuid("category_id").notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    brand: text(),
    sku: text().default(gen_random_uuid()).notNull(),
    productType: text("product_type"),
    productCode: text("product_code"),
    ncmCode: text("ncm_code"),
    status: text().default("draft"),
    collection: text(),
    tags: text().array(),
    costPriceInCents: integer("cost_price_in_cents"),
    salePriceInCents: integer("sale_price_in_cents"),
    promoPriceInCents: integer("promo_price_in_cents"),
    taxRate: integer("tax_rate"),
    weightInGrams: integer("weight_in_grams"),
    lengthInCm: integer("length_in_cm"),
    widthInCm: integer("width_in_cm"),
    heightInCm: integer("height_in_cm"),
    hasFreeShipping: boolean("has_free_shipping").default(false),
    hasLocalPickup: boolean("has_local_pickup").default(false),
    warrantyPeriodInDays: integer("warranty_period_in_days"),
    warrantyProvider: text("warranty_provider"),
    sellerCode: text("seller_code"),
    internalCode: text("internal_code"),
    sellerInfo: text("seller_info"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isActive: boolean("is_active").default(true),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    canonicalUrl: text("canonical_url"),
    cardShortText: text("card_short_text"),
    storeProductFlags: text("store_product_flags").array().default([""]),
    allowedDeliveryTypes: text("allowed_delivery_types")
      .array()
      .default(["own"]),
    allowsOwnDelivery: boolean("allows_own_delivery").default(true),
    allowsSupplierDelivery: boolean("allows_supplier_delivery").default(false),
    allowsPickup: boolean("allows_pickup").default(false),
    requiresCarrierOnly: boolean("requires_carrier_only").default(false),
    preferredSupplierIds: jsonb("preferred_supplier_ids").default([]),
    allowedDeliveryMethodIds: jsonb("allowed_delivery_method_ids").default([]),
    additionalDeliveryDays: integer("additional_delivery_days").default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: "product_category_id_category_id_fk",
    }).onDelete("set null"),
    unique("product_slug_unique").on(table.slug),
  ],
);

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const category = pgTable(
  "category",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    description: text(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isActive: boolean("is_active").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    parentId: uuid("parent_id"),
    level: integer().default(0).notNull(),
    orderIndex: integer("order_index").default(0),
    imageUrl: text("image_url"),
  },
  (table) => [
    index("category_parent_idx").using(
      "btree",
      table.parentId.asc().nullsLast().op("uuid_ops"),
    ),
    index("category_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    unique("category_slug_unique").on(table.slug),
  ],
);

export const cart = pgTable(
  "cart",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    shippingAddressId: uuid("shipping_address_id"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "cart_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.shippingAddressId],
      foreignColumns: [shippingAddress.id],
      name: "cart_shipping_address_id_shipping_address_id_fk",
    }).onDelete("set null"),
  ],
);

export const productVariant = pgTable(
  "product_variant",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id").notNull(),
    name: text(),
    priceInCents: integer("price_in_cents").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    sku: text().notNull(),
    attributes: jsonb().default({}).notNull(),
    comparePriceInCents: integer("compare_price_in_cents"),
    costPriceInCents: integer("cost_price_in_cents"),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    weightInGrams: integer("weight_in_grams"),
    lengthInCm: integer("length_in_cm"),
    widthInCm: integer("width_in_cm"),
    heightInCm: integer("height_in_cm"),
    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_variant_product_id_product_id_fk",
    }).onDelete("cascade"),
    unique("product_variant_sku_unique").on(table.sku),
  ],
);

export const shippingAddress = pgTable(
  "shipping_address",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
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
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "shipping_address_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    cartId: uuid("cart_id").notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    quantity: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [cart.id],
      name: "cart_item_cart_id_cart_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariant.id],
      name: "cart_item_product_variant_id_product_variant_id_fk",
    }).onDelete("cascade"),
  ],
);

export const productPricing = pgTable(
  "product_pricing",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id").notNull(),
    type: text().notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    deliveryDays: text("delivery_days"),
    hasPromo: boolean("has_promo").default(false),
    promoType: text("promo_type"),
    promoPriceInCents: integer("promo_price_in_cents"),
    legadoPromocaoMigradoEm: timestamp("legado_promocao_migrado_em", {
      mode: "string",
    }),
    legadoPromocaoMigradoParaRegraId: uuid(
      "legado_promocao_migrado_para_regra_id",
    ),
    promoDuration: integer("promo_duration"),
    promoDurationUnit: text("promo_duration_unit"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    pricingModalDescription: text("pricing_modal_description"),
    mainCardPrice: boolean("main_card_price").default(false),
    promoEndDate: timestamp("promo_end_date", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_pricing_product_id_product_id_fk",
    }).onDelete("cascade"),
  ],
);

export const cities = pgTable(
  "cities",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    stateUf: varchar("state_uf", { length: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    neighborhoodsCount: integer("neighborhoods_count").default(0).notNull(),
    hasSlotsConfigured: boolean("has_slots_configured")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.stateUf],
      foreignColumns: [states.uf],
      name: "cities_state_uf_states_uf_fk",
    }),
  ],
);

export const deliveryMethods = pgTable("delivery_methods", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  type: varchar({ length: 20 }).notNull(),
  description: varchar({ length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  priceConfig: jsonb("price_config").notNull(),
  minDays: integer("min_days").default(0).notNull(),
  maxDays: integer("max_days").default(0).notNull(),
  cutoffTimes: jsonb("cutoff_times").default([]).notNull(),
  allowsScheduling: boolean("allows_scheduling").default(false).notNull(),
  operatingDays: jsonb("operating_days").default([1, 2, 3, 4, 5, 6]).notNull(),
  maxWeight: numeric("max_weight", { precision: 8, scale: 2 }),
  maxDimensions: jsonb("max_dimensions"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const order = pgTable(
  "order",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    shippingAddressId: uuid("shipping_address_id").notNull(),
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
    status: orderStatus().default("pending").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "order_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.shippingAddressId],
      foreignColumns: [shippingAddress.id],
      name: "order_shipping_address_id_shipping_address_id_fk",
    }).onDelete("set null"),
  ],
);

export const orderItem = pgTable(
  "order_item",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id").notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    quantity: integer().notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [order.id],
      name: "order_item_order_id_order_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariant.id],
      name: "order_item_product_variant_id_product_variant_id_fk",
    }).onDelete("restrict"),
  ],
);

export const states = pgTable(
  "states",
  {
    id: serial().primaryKey().notNull(),
    uf: varchar({ length: 2 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("states_uf_unique").on(table.uf)],
);

export const neighborhoods = pgTable(
  "neighborhoods",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 100 }).notNull(),
    cityId: integer("city_id").notNull(),
    cityName: varchar("city_name", { length: 100 }).notNull(),
    stateUf: varchar("state_uf", { length: 2 }).notNull(),
    cepRange: jsonb("cep_range").notNull(),
    deliverySlots: jsonb("delivery_slots").default([]).notNull(),
    hasActiveSlots: boolean("has_active_slots").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    totalDeliveries: integer("total_deliveries").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.cityId],
      foreignColumns: [cities.id],
      name: "neighborhoods_city_id_cities_id_fk",
    }),
  ],
);

export const productDeliveryMethods = pgTable(
  "product_delivery_methods",
  {
    id: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity({
        name: "product_delivery_methods_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 2147483647,
        cache: 1,
      }),
    productId: uuid("product_id").notNull(),
    deliveryMethodId: integer("delivery_method_id").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    customPriceInCents: integer("custom_price_in_cents"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_delivery_methods_product_id_product_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.deliveryMethodId],
      foreignColumns: [deliveryMethods.id],
      name: "product_delivery_methods_delivery_method_id_delivery_methods_id",
    }).onDelete("cascade"),
  ],
);

export const productSuppliers = pgTable(
  "product_suppliers",
  {
    id: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity({
        name: "product_suppliers_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 2147483647,
        cache: 1,
      }),
    productId: uuid("product_id").notNull(),
    supplierId: integer("supplier_id").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    rules: jsonb().default({}),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_suppliers_product_id_product_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.supplierId],
      foreignColumns: [suppliers.id],
      name: "product_suppliers_supplier_id_suppliers_id_fk",
    }).onDelete("cascade"),
  ],
);

export const suppliers = pgTable("suppliers", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  type: varchar({ length: 20 }).notNull(),
  description: text().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deliveryConfig: jsonb("delivery_config").notNull(),
  servedRegions: jsonb("served_regions").default([]).notNull(),
  linkedProductsCount: integer("linked_products_count").default(0).notNull(),
  contactInfo: jsonb("contact_info"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const shippingBairroAvulsoSlots = pgTable(
  "shipping_bairro_avulso_slots",
  {
    id: serial().primaryKey().notNull(),
    bairroAvulsoId: integer("bairro_avulso_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bairroAvulsoId],
      foreignColumns: [bairrosAvulsos.id],
      name: "shipping_bairro_avulso_slots_bairro_avulso_id_bairros_avulsos_i",
    }).onDelete("cascade"),
  ],
);

export const shippingRegionSlots = pgTable(
  "shipping_region_slots",
  {
    id: serial().primaryKey().notNull(),
    regionId: integer("region_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.regionId],
      foreignColumns: [shippingRegions.id],
      name: "shipping_region_slots_region_id_shipping_regions_id_fk",
    }).onDelete("cascade"),
  ],
);

export const productVariantImage = pgTable(
  "product_variant_image",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    variantId: uuid("variant_id").notNull(),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariant.id],
      name: "product_variant_image_variant_id_product_variant_id_fk",
    }).onDelete("cascade"),
  ],
);

export const productImage = pgTable(
  "product_image",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    imageUrl: text("image_url"),
    externalImageId: text("external_image_id"),
    sortOrder: integer("sort_order").notNull(),
    altText: text("alt_text"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productVariantId],
      foreignColumns: [productVariant.id],
      name: "product_image_product_variant_id_product_variant_id_fk",
    }).onDelete("cascade"),
  ],
);

export const productAttribute = pgTable(
  "product_attribute",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id").notNull(),
    name: text().notNull(),
    values: text().array().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_attribute_product_id_product_id_fk",
    }).onDelete("cascade"),
  ],
);

export const productGalleryImages = pgTable(
  "product_gallery_images",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id").notNull(),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    isPrimary: boolean("is_primary").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_gallery_images_product_id_product_id_fk",
    }).onDelete("cascade"),
  ],
);

export const cepsEspecificos = pgTable(
  "ceps_especificos",
  {
    id: serial().primaryKey().notNull(),
    cep: varchar({ length: 8 }).notNull(),
    neighborhood: varchar({ length: 100 }).notNull(),
    city: varchar({ length: 100 }).notNull(),
    state: varchar({ length: 2 }).notNull(),
    shippingPrice: integer("shipping_price").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("ceps_especificos_cep_unique").on(table.cep)],
);

export const shippingRegions = pgTable("shipping_regions", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  city: varchar({ length: 100 }).notNull(),
  state: varchar({ length: 2 }).notNull(),
  baseShippingPrice: integer("base_shipping_price").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const regiaoBairros = pgTable(
  "regiao_bairros",
  {
    id: serial().primaryKey().notNull(),
    regiaoId: integer("regiao_id").notNull(),
    neighborhood: varchar({ length: 100 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.regiaoId],
      foreignColumns: [shippingRegions.id],
      name: "regiao_bairros_regiao_id_shipping_regions_id_fk",
    }).onDelete("cascade"),
  ],
);

export const bairrosAvulsos = pgTable("bairros_avulsos", {
  id: serial().primaryKey().notNull(),
  neighborhood: varchar({ length: 100 }).notNull(),
  city: varchar({ length: 100 }).notNull(),
  state: varchar({ length: 2 }).notNull(),
  baseShippingPrice: integer("base_shipping_price").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const configHorario = pgTable(
  "config_horario",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    horaAbertura: time("hora_abertura").notNull(),
    horaFechamento: time("hora_fechamento").notNull(),
    usaIntervaloAlmoco: boolean("usa_intervalo_almoco")
      .default(false)
      .notNull(),
    horaAlmocoInicio: time("hora_almoco_inicio"),
    horaAlmocoFim: time("hora_almoco_fim"),
    diasFuncionamento: text("dias_funcionamento").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("config_horario_dias_idx").using(
      "btree",
      table.diasFuncionamento.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const feriados = pgTable(
  "feriados",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    data: date().notNull(),
    descricao: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feriados_data_idx").using(
      "btree",
      table.data.asc().nullsLast().op("date_ops"),
    ),
  ],
);

export const prazosRetirada = pgTable(
  "prazos_retirada",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    nome: text().notNull(),
    slug: text().notNull(),
    ativo: boolean().default(true).notNull(),
    config: jsonb(),
    mensagemPadrao: text("mensagem_padrao"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("prazos_retirada_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    unique("prazos_retirada_slug_unique").on(table.slug),
  ],
);

export const produtoRetirada = pgTable(
  "produto_retirada",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid("product_id").notNull(),
    pontoColetaId: uuid("ponto_coleta_id").notNull(),
    modalidadeId: uuid("modalidade_id").notNull(),
    mensagemPersonalizada: text("mensagem_personalizada"),
    createdId: timestamp("created_id", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("produto_retirada_modalidade_idx").using(
      "btree",
      table.modalidadeId.asc().nullsLast().op("uuid_ops"),
    ),
    index("produto_retirada_ponto_idx").using(
      "btree",
      table.pontoColetaId.asc().nullsLast().op("uuid_ops"),
    ),
    index("produto_retirada_product_idx").using(
      "btree",
      table.productId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "produto_retirada_product_id_product_id_fk",
    }),
    foreignKey({
      columns: [table.pontoColetaId],
      foreignColumns: [pontosColeta.id],
      name: "produto_retirada_ponto_coleta_id_pontos_coleta_id_fk",
    }),
    foreignKey({
      columns: [table.modalidadeId],
      foreignColumns: [prazosRetirada.id],
      name: "produto_retirada_modalidade_id_prazos_retirada_id_fk",
    }),
  ],
);

export const pontosColeta = pgTable(
  "pontos_coleta",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    nome: text().notNull(),
    slug: text().notNull(),
    endereco: text().notNull(),
    cidade: text().notNull(),
    estado: text().notNull(),
    cep: text().notNull(),
    ativo: boolean().default(true).notNull(),
    herdaHorarioGlobal: boolean("herda_horario_global").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("pontos_coleta_cidade_idx").using(
      "btree",
      table.cidade.asc().nullsLast().op("text_ops"),
    ),
    index("pontos_coleta_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    unique("pontos_coleta_slug_unique").on(table.slug),
  ],
);
