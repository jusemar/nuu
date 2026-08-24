"use server";

import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { exigirAcessoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import { alterarStatusVinculoProdutoFornecedor as alterarStatusVinculoProdutoFornecedorService } from "../services/alterar-status-vinculo-produto-fornecedor.service";

export async function alterarStatusVinculoProdutoFornecedor(
  formData: FormData,
) {
  await exigirAcessoFornecedoresAdmin(
    PERMISSOES_ADMIN.FORNECEDORES.ADMINISTRAR,
  );
  await alterarStatusVinculoProdutoFornecedorService({
    id: formData.get("id"),
    fornecedorId: formData.get("fornecedorId"),
    status: formData.get("status"),
  });

  revalidatePath("/admin/fornecedores");
  revalidatePath("/admin/fornecedores/importacoes");
}
