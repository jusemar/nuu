"use server";

import { buscarMarcasPromocaoAdmin as buscarMarcasPromocaoAdminQuery } from "../queries";

export async function buscarMarcasPromocaoAdmin(entrada: unknown) {
  return buscarMarcasPromocaoAdminQuery(entrada);
}
