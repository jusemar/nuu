"use server";

import { revalidatePath } from "next/cache";

import { tratarProdutosFornecedorComoNovos as tratarProdutosFornecedorComoNovosService } from "../services/tratar-produtos-fornecedor-como-novos.service";

export async function tratarProdutosFornecedorComoNovos(formData: FormData) {
  const importacaoId = String(formData.get("importacaoId") ?? "");
  const stagingIds = formData.getAll("stagingIds").map(String);

  const resultado = await tratarProdutosFornecedorComoNovosService({
    importacaoId,
    stagingIds,
  });

  revalidatePath("/admin/fornecedores/importacoes");
  revalidatePath(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}
