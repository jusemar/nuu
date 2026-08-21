import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { fornecedoresTable } from "../../tables/fornecedores/tabelas/fornecedores";
import { marcaTable } from "../marcas/marcas";
import { productVariantTable } from "./product-variants";
import { productTable } from "./products";

export const identificadorCatalogoTipoEnum = pgEnum(
  "identificador_catalogo_tipo",
  ["gtin", "mpn"],
);

export const identificadorCatalogoGtinTipoEnum = pgEnum(
  "identificador_catalogo_gtin_tipo",
  ["gtin_8", "gtin_12", "gtin_13", "gtin_14"],
);

export const identificadorCatalogoOrigemEnum = pgEnum(
  "identificador_catalogo_origem",
  ["manual_admin", "fornecedor_importacao"],
);

export const identificadorCatalogoStatusEnum = pgEnum(
  "identificador_catalogo_status",
  ["pendente", "verificado", "rejeitado", "conflito"],
);

/**
 * Identificadores comerciais com procedência preservada.
 *
 * Um registro principal é o valor canônico; candidatos divergentes continuam
 * armazenados como conflito, sem substituir silenciosamente o valor confiável.
 */
export const identificadoresCatalogoTable = pgTable(
  "produto_identificadores_catalogo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tipo: identificadorCatalogoTipoEnum("tipo").notNull(),
    valor: text("valor").notNull(),
    gtinTipo: identificadorCatalogoGtinTipoEnum("gtin_tipo"),

    // GTIN aponta sempre para variante; MPN escolhe explicitamente um escopo.
    produtoId: uuid("produto_id").references(() => productTable.id, {
      onDelete: "cascade",
    }),
    varianteId: uuid("variante_id").references(() => productVariantTable.id, {
      onDelete: "cascade",
    }),
    marcaId: uuid("marca_id").references(() => marcaTable.id, {
      onDelete: "set null",
    }),

    origem: identificadorCatalogoOrigemEnum("origem").notNull(),
    fornecedorId: uuid("fornecedor_id").references(() => fornecedoresTable.id, {
      onDelete: "set null",
    }),
    referenciaOrigem: text("referencia_origem"),
    status: identificadorCatalogoStatusEnum("status")
      .notNull()
      .default("pendente"),
    motivoStatus: text("motivo_status"),
    principal: boolean("principal").notNull().default(false),
    verificadoEm: timestamp("verificado_em", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "produto_identificador_escopo_unico_check",
      sql`num_nonnulls(${table.produtoId}, ${table.varianteId}) = 1`,
    ),
    check(
      "produto_identificador_gtin_escopo_check",
      sql`${table.tipo} <> 'gtin' OR (${table.varianteId} IS NOT NULL AND ${table.produtoId} IS NULL)`,
    ),
    check(
      "produto_identificador_gtin_tipo_check",
      sql`(${table.tipo} = 'gtin' AND ${table.gtinTipo} IS NOT NULL) OR (${table.tipo} = 'mpn' AND ${table.gtinTipo} IS NULL)`,
    ),
    check(
      "produto_identificador_valor_check",
      sql`btrim(${table.valor}) <> ''`,
    ),
    check(
      "produto_identificador_gtin_formato_check",
      sql`${table.tipo} <> 'gtin' OR (${table.valor} ~ '^[0-9]+$' AND length(${table.valor}) IN (8, 12, 13, 14))`,
    ),
    index("produto_identificador_produto_idx").on(table.produtoId),
    index("produto_identificador_variante_idx").on(table.varianteId),
    index("produto_identificador_fornecedor_idx").on(table.fornecedorId),
    index("produto_identificador_status_idx").on(table.status),
    uniqueIndex("produto_identificador_principal_produto_unique")
      .on(table.produtoId, table.tipo)
      .where(sql`${table.principal} AND ${table.produtoId} IS NOT NULL`),
    uniqueIndex("produto_identificador_principal_variante_unique")
      .on(table.varianteId, table.tipo)
      .where(sql`${table.principal} AND ${table.varianteId} IS NOT NULL`),
    uniqueIndex("produto_identificador_gtin_principal_unique")
      .on(table.valor)
      .where(sql`${table.tipo} = 'gtin' AND ${table.principal}`),
  ],
);

export type IdentificadorCatalogo =
  typeof identificadoresCatalogoTable.$inferSelect;
export type NovoIdentificadorCatalogo =
  typeof identificadoresCatalogoTable.$inferInsert;
