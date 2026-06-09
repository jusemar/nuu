"use server";

import { buscarRegioesPromocaoAdmin as buscarRegioesPromocaoAdminQuery } from "../queries";

export async function buscarRegioesPromocaoAdmin(entrada: unknown) {
  return buscarRegioesPromocaoAdminQuery(entrada);
}
