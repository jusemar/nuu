"use server";

import { revalidatePath } from "next/cache";

import { salvarVinculoProdutoFornecedorManual as salvarVinculoProdutoFornecedorManualService } from "../services/salvar-vinculo-produto-fornecedor-manual.service";

export async function salvarVinculoProdutoFornecedorManual(formData: FormData) {
  await salvarVinculoProdutoFornecedorManualService({
    id: formData.get("id") || undefined,
    fornecedorId: formData.get("fornecedorId"),
    produtoId: formData.get("produtoId"),
    codigoFornecedor: formData.get("codigoFornecedor"),
    status: formData.get("status") || "ativo",
  });

  revalidatePath("/admin/fornecedores");
  revalidatePath("/admin/fornecedores/importacoes");
}
