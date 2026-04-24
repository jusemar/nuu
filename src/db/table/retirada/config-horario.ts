import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  time,
  integer,
  index
} from "drizzle-orm/pg-core";

export const configHorarioTable = pgTable("config_horario", {
  id: uuid().primaryKey().defaultRandom(),
  horaAbertura: time("hora_abertura", { withTimezone: false }).notNull(),
  horaFechamento: time("hora_fechamento", { withTimezone: false }).notNull(),
  usaIntervaloAlmoco: boolean("usa_intervalo_almoco").default(false).notNull(),
  horaAlmocoInicio: time("hora_almoco_inicio"),
  horaAlmocoFim: time("hora_almoco_fim"),
  diasFuncionamento: text("dias_funcionamento").notNull(),
  createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  diasIdx: index("config_horario_dias_idx").on(table.diasFuncionamento),
}));