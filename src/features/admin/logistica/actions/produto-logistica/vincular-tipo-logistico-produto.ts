"use server";

import { revalidatePath } from "next/cache";

import { vincularProdutoTipoLogistico } from "../tipos-logisticos";

export async function vincularTipoLogisticoProduto({
  produtoId,
  tipoLogisticoId,
}: {
  produtoId: string;
  tipoLogisticoId: string;
}) {
  if (!produtoId) {
    return { sucesso: false as const, erro: "Produto obrigatório" };
  }

  const resposta = await vincularProdutoTipoLogistico({ produtoId, tipoLogisticoId });

  revalidatePath("/admin/products");
  return resposta;
}

