"use server";

import { revalidatePath } from "next/cache";

import { vincularProdutoFornecedor as vincularProdutoFornecedorService } from "../services/vincular-produto-fornecedor.service";

export async function vincularProdutoFornecedor(formData: FormData) {
  const resultado = await vincularProdutoFornecedorService({
    stagingId: formData.get("stagingId"),
    produtoId: formData.get("produtoId"),
  });

  revalidatePath("/admin/fornecedores/importacoes");
  revalidatePath(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}
