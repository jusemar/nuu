import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { categoryTable } from "./categories";

export const categoryFaqTable = pgTable(
  "category_faq",
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "cascade" }),
    question: text().notNull(),
    answer: text().notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("category_faq_category_id_idx").on(table.categoryId),
    check("category_faq_order_index_nao_negativo", sql`${table.orderIndex} >= 0`),
  ],
);
