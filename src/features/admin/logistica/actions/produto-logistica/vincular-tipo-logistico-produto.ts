"use server";

import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { vincularProdutoTipoLogistico } from "../tipos-logisticos";

export async function vincularTipoLogisticoProduto({
  produtoId,
  tipoLogisticoId,
}: {
  produtoId: string;
  tipoLogisticoId: string;
}) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!produtoId) {
    return { sucesso: false as const, erro: "Produto obrigatório" };
  }

  const resposta = await vincularProdutoTipoLogistico({
    produtoId,
    tipoLogisticoId,
  });

  revalidatePath("/admin/products");
  return resposta;
}
