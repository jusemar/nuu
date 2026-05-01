import { relations } from "drizzle-orm";
import { configHorarioTable } from "./config-horario";
import { feriadosTable } from "./feriados";
import { modelosRetiradaTable } from "./modelos-retirada";

export { configHorarioTable } from "./config-horario";
export { feriadosTable } from "./feriados";
export { modelosRetiradaTable } from "./modelos-retirada";

export const configHorarioRelations = relations(configHorarioTable, ({ many }) => ({
  Holidays: many(feriadosTable),
}));

export const feriadosRelations = relations(feriadosTable, ({ many }) => ({
  Holidays: many(feriadosTable),
}));
