"use server";

import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { desvincularProdutoTipoLogistico } from "../tipos-logisticos";

export async function desvincularTipoLogisticoProduto(vinculoId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const resposta = await desvincularProdutoTipoLogistico(vinculoId);
  revalidatePath("/admin/products");
  return resposta;
}
