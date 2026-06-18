"use server";

import { revalidatePath } from "next/cache";

import { alterarStatusVinculoProdutoFornecedor as alterarStatusVinculoProdutoFornecedorService } from "../services/alterar-status-vinculo-produto-fornecedor.service";

export async function alterarStatusVinculoProdutoFornecedor(
  formData: FormData,
) {
  await alterarStatusVinculoProdutoFornecedorService({
    id: formData.get("id"),
    fornecedorId: formData.get("fornecedorId"),
    status: formData.get("status"),
  });

  revalidatePath("/admin/fornecedores");
  revalidatePath("/admin/fornecedores/importacoes");
}
