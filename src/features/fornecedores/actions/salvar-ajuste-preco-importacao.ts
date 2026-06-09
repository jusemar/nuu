"use server";

import { revalidatePath } from "next/cache";

import { salvarAjustePrecoImportacaoFornecedor } from "../services/salvar-ajuste-preco-importacao.service";

export async function salvarAjustePrecoImportacao(formData: FormData) {
  await salvarAjustePrecoImportacaoFornecedor({
    importacaoId: formData.get("importacaoId"),
    tipoAjuste: formData.get("tipoAjuste"),
    escopoAjuste: formData.get("escopoAjuste"),
    valorAjuste: formData.get("valorAjuste"),
    categoriaFornecedor: formData.get("categoriaFornecedor"),
    produtoStagingId: formData.get("produtoStagingId"),
  });

  revalidatePath("/admin/fornecedores/importacoes");
}
