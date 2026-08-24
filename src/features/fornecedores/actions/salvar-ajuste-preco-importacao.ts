"use server";

import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { exigirAcessoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import { salvarAjustePrecoImportacaoFornecedor } from "../services/salvar-ajuste-preco-importacao.service";

export async function salvarAjustePrecoImportacao(formData: FormData) {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);
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
