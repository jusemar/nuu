import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const configuracoesBarraAvisosTable = pgTable(
  "configuracoes_barra_avisos",
  {
    id: text("id").primaryKey().default("global"),
    ativo: boolean("ativo").notNull().default(true),
    corFundo: text("cor_fundo").notNull().default("#0c447c"),
    corTexto: text("cor_texto").notNull().default("#ffffff"),
    velocidadeSegundos: integer("velocidade_segundos").notNull().default(60),
    pausarHover: boolean("pausar_hover").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
);

export const mensagensBarraAvisosTable = pgTable(
  "mensagens_barra_avisos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    configuracaoId: text("configuracao_id")
      .notNull()
      .references(() => configuracoesBarraAvisosTable.id, {
        onDelete: "cascade",
      }),
    texto: text("texto").notNull(),
    icone: text("icone"),
    ativo: boolean("ativo").notNull().default(true),
    ordem: integer("ordem").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (tabela) => [
    index("mensagens_barra_avisos_configuracao_ordem_idx").on(
      tabela.configuracaoId,
      tabela.ordem,
    ),
  ],
);
