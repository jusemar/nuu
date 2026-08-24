"use server";

import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { exigirAcessoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import { vincularProdutoFornecedor as vincularProdutoFornecedorService } from "../services/vincular-produto-fornecedor.service";

export async function vincularProdutoFornecedor(formData: FormData) {
  await exigirAcessoFornecedoresAdmin(
    PERMISSOES_ADMIN.FORNECEDORES.ADMINISTRAR,
  );
  const resultado = await vincularProdutoFornecedorService({
    stagingId: formData.get("stagingId"),
    produtoId: formData.get("produtoId"),
  });

  revalidatePath("/admin/fornecedores/importacoes");
  revalidatePath(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}
