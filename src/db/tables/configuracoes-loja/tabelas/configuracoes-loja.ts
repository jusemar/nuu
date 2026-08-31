import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const configuracoesLojaTable = pgTable("configuracoes_loja", {
  id: text("id").primaryKey().default("global"),
  nomeComercial: text("nome_comercial"),
  logoCabecalhoUrl: text("logo_cabecalho_url"),
  logoRodapeUrl: text("logo_rodape_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type ConfiguracaoLoja = typeof configuracoesLojaTable.$inferSelect;
