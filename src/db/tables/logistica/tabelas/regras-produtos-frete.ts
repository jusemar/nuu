import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { productTable } from "../../../table/products/products";
import { provedoresFreteTable } from "./provedores-frete";
import { servicosFreteTable } from "./servicos-frete";
import { transportadorasFreteTable } from "./transportadoras-frete";

export const regrasProdutosFreteTable = pgTable(
  "regras_produtos_frete",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: uuid("produto_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    efeito: text("efeito").$type<"permitir" | "bloquear">().notNull(),
    provedorFreteId: uuid("provedor_frete_id").references(
      () => provedoresFreteTable.id,
      { onDelete: "cascade" },
    ),
    transportadoraFreteId: uuid("transportadora_frete_id").references(
      () => transportadorasFreteTable.id,
      { onDelete: "cascade" },
    ),
    servicoFreteId: uuid("servico_frete_id").references(
      () => servicosFreteTable.id,
      { onDelete: "cascade" },
    ),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("regras_produtos_frete_produto_id_idx").on(table.produtoId),
    index("regras_produtos_frete_provedor_frete_id_idx").on(
      table.provedorFreteId,
    ),
    index("regras_produtos_frete_transportadora_frete_id_idx").on(
      table.transportadoraFreteId,
    ),
    index("regras_produtos_frete_servico_frete_id_idx").on(
      table.servicoFreteId,
    ),
  ],
);
