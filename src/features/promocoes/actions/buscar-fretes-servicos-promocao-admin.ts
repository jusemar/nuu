"use server";

import { buscarFretesServicosPromocaoAdmin as buscarFretesServicosPromocaoAdminQuery } from "../queries";

export async function buscarFretesServicosPromocaoAdmin(entrada: unknown) {
  return buscarFretesServicosPromocaoAdminQuery(entrada);
}
