"use server";

import { buscarProdutosPromocaoAdmin as buscarProdutosPromocaoAdminQuery } from "../queries";

export async function buscarProdutosPromocaoAdmin(entrada: unknown) {
  return buscarProdutosPromocaoAdminQuery(entrada);
}
