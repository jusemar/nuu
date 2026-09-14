/*import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const categoryTable = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  // Conteúdo editorial inferior; HTML será sanitizado somente na etapa pública.
  descriptionBottom: text("description_bottom"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
});*/

// src/db/table/categories/categories.ts
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { modoDisponibilidadeEntregaPropriaEnum } from "../logistics/entrega-propria/modo-disponibilidade-entrega-propria";
import { modoDisponibilidadeFreteExternoEnum } from "../logistics/frete-externo/modo-disponibilidade-frete-externo";

export const categoryTable = pgTable(
  "category",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text(),
    // Campo já criado pela migration editorial 0009.
    descriptionBottom: text("description_bottom"),

    // Apenas campo, sem .references() aqui!
    parentId: uuid("parent_id"),

    level: integer("level").notNull().default(0),
    orderIndex: integer("order_index").default(0),
    imageUrl: text("image_url"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isActive: boolean("is_active").default(true).notNull(),
    /**
     * Disponibilidade do Frete Externo para os produtos da categoria (e das
     * subcategorias que herdam). `herdar` sobe para a categoria pai.
     */
    disponibilidadeFreteExterno: modoDisponibilidadeFreteExternoEnum(
      "disponibilidade_frete_externo",
    )
      .notNull()
      .default("herdar"),
    /**
     * Disponibilidade da Entrega Própria para os produtos que herdam.
     * Os preços por destino ficam em `category_own_delivery_prices`.
     */
    disponibilidadeEntregaPropria: modoDisponibilidadeEntregaPropriaEnum(
      "disponibilidade_entrega_propria",
    )
      .notNull()
      .default("herdar"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    parentIdx: index("category_parent_idx").on(table.parentId),
    slugIdx: index("category_slug_idx").on(table.slug),
  }),
);
