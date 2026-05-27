import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { provedoresFreteTable } from "./provedores-frete";
import { servicosFreteTable } from "./servicos-frete";
import { tiposLogisticosTable } from "./tipos-logisticos";
import { transportadorasFreteTable } from "./transportadoras-frete";

export const regrasTiposLogisticosFreteTable = pgTable(
  "regras_tipos_logisticos_frete",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tipoLogisticoId: uuid("tipo_logistico_id")
      .notNull()
      .references(() => tiposLogisticosTable.id, { onDelete: "cascade" }),
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
    index("regras_tipos_logisticos_frete_tipo_id_idx").on(
      table.tipoLogisticoId,
    ),
    index("regras_tipos_logisticos_frete_provedor_id_idx").on(
      table.provedorFreteId,
    ),
    index("regras_tipos_logisticos_frete_transportadora_id_idx").on(
      table.transportadoraFreteId,
    ),
    index("regras_tipos_logisticos_frete_servico_id_idx").on(
      table.servicoFreteId,
    ),
  ],
);
