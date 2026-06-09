"use server";

import { buscarCategoriasPromocaoAdmin as buscarCategoriasPromocaoAdminQuery } from "../queries";

export async function buscarCategoriasPromocaoAdmin(entrada: unknown) {
  return buscarCategoriasPromocaoAdminQuery(entrada);
}
