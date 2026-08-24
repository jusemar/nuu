"use server";

import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { exigirAcessoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import { tratarProdutosFornecedorComoNovos as tratarProdutosFornecedorComoNovosService } from "../services/tratar-produtos-fornecedor-como-novos.service";

export async function tratarProdutosFornecedorComoNovos(formData: FormData) {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);
  const importacaoId = String(formData.get("importacaoId") ?? "");
  const stagingIds = formData.getAll("stagingIds").map(String);

  const resultado = await tratarProdutosFornecedorComoNovosService({
    importacaoId,
    stagingIds,
  });

  revalidatePath("/admin/fornecedores/importacoes");
  revalidatePath(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}
