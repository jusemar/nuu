import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { provedoresFreteTable } from "./provedores-frete";

export const transportadorasFreteTable = pgTable(
  "transportadoras_frete",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provedorFreteId: uuid("provedor_frete_id")
      .notNull()
      .references(() => provedoresFreteTable.id, { onDelete: "cascade" }),
    identificador: text("identificador").notNull(),
    nome: text("nome").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    pesoMaximoEmGramas: integer("peso_maximo_em_gramas"),
    alturaMaximaEmCm: integer("altura_maxima_em_cm"),
    larguraMaximaEmCm: integer("largura_maxima_em_cm"),
    comprimentoMaximoEmCm: integer("comprimento_maximo_em_cm"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("transportadoras_frete_provedor_identificador_unique").on(
      table.provedorFreteId,
      table.identificador,
    ),
    index("transportadoras_frete_provedor_frete_id_idx").on(
      table.provedorFreteId,
    ),
  ],
);
