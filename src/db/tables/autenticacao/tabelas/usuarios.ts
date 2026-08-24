import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userTable = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
      .$defaultFn(() => false)
      .notNull(),
    image: text("image"),
    // Identificador alternativo exclusivo do admin. Nulo preserva contas antigas.
    whatsapp: text("whatsapp"),
    // Identidade telefônica canônica que futuramente será administrada pelo
    // plugin oficial phoneNumber do Better Auth. O legado `whatsapp` permanece
    // separado para que nenhum contato antigo seja tratado como verificado.
    phoneNumber: text("phone_number").unique(),
    phoneNumberVerified: boolean("phone_number_verified")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("user_whatsapp_unique").on(table.whatsapp)],
);
