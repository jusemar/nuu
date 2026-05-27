"use server";

import { revalidatePath } from "next/cache";

import { desvincularProdutoTipoLogistico } from "../tipos-logisticos";

export async function desvincularTipoLogisticoProduto(vinculoId: string) {
  const resposta = await desvincularProdutoTipoLogistico(vinculoId);
  revalidatePath("/admin/products");
  return resposta;
}

