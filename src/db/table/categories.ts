import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const categoryTable = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(), // Para a descrição da categoria
  metaTitle: text("meta_title"), // Para SEO
  metaDescription: text("meta_description"), // Para SEO  
  isActive: boolean("is_active").default(true).notNull(), // Para status ativo/inativo
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

