import { relations } from "drizzle-orm";
import { configHorarioTable } from "./config-horario";
import { feriadosTable } from "./feriados";
import { modalidadesRetiradaTable } from "./modalidades";
import { pontosColetaTable } from "./pontos-coleta";
import { produtoRetiradaTable } from "./produto-retirada";
import { productTable } from "../products/products";

export { configHorarioTable } from "./config-horario";
export { feriadosTable } from "./feriados";
export { modalidadesRetiradaTable } from "./modalidades";
export { pontosColetaTable } from "./pontos-coleta";
export { produtoRetiradaTable } from "./produto-retirada";

export const configHorarioRelations = relations(configHorarioTable, ({ many }) => ({
  pontosColeta: many(pontosColetaTable),
}));

export const feriadosRelations = relations(feriadosTable, ({ many }) => ({
  Holidays: many(feriadosTable),
}));

export const modalidadesRetiradaRelations = relations(modalidadesRetiradaTable, ({ many }) => ({
  produtoRetiradas: many(produtoRetiradaTable),
}));

export const pontosColetaRelations = relations(pontosColetaTable, ({ one, many }) => ({
  configHorario: one(configHorarioTable, {
    fields: [],
    references: [],
  }),
  produtoRetiradas: many(produtoRetiradaTable),
}));

export const produtoRetiradaRelations = relations(produtoRetiradaTable, ({ one }) => ({
  product: one(productTable, {
    fields: [produtoRetiradaTable.productId],
    references: [productTable.id],
  }),
  pontoColeta: one(pontosColetaTable, {
    fields: [produtoRetiradaTable.pontoColetaId],
    references: [pontosColetaTable.id],
  }),
  modalidade: one(modalidadesRetiradaTable, {
    fields: [produtoRetiradaTable.modalidadeId],
    references: [modalidadesRetiradaTable.id],
  }),
}));