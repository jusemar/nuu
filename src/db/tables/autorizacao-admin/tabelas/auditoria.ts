import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { auditoriaAdministrativaResultadoEnum } from "../enums";
import { administradoresTable } from "./principais";

/** Registro append-only futuro, sem campos destinados a segredos ou tokens. */
export const auditoriasAdministrativasTable = pgTable(
  "auditorias_administrativas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    atorAdministradorId: uuid("ator_administrador_id").references(
      () => administradoresTable.id,
      { onDelete: "set null" },
    ),
    alvoAdministradorId: uuid("alvo_administrador_id").references(
      () => administradoresTable.id,
      { onDelete: "set null" },
    ),
    acao: text("acao").notNull(),
    resultado: auditoriaAdministrativaResultadoEnum("resultado").notNull(),
    recursoTipo: text("recurso_tipo"),
    recursoId: text("recurso_id"),
    metadados: jsonb("metadados")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auditorias_administrativas_ator_data_idx").on(
      table.atorAdministradorId,
      table.createdAt,
    ),
    index("auditorias_administrativas_alvo_data_idx").on(
      table.alvoAdministradorId,
      table.createdAt,
    ),
    index("auditorias_administrativas_acao_resultado_data_idx").on(
      table.acao,
      table.resultado,
      table.createdAt,
    ),
  ],
);
