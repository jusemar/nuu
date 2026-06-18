"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { importarPlanilhaFornecedorParaStaging } from "../services/importacao-planilha-fornecedor.service";

export async function importarPlanilhaFornecedor(formData: FormData) {
  const fornecedorId = String(formData.get("fornecedorId") ?? "");
  const arquivo = formData.get("arquivo");

  if (!fornecedorId) {
    throw new Error("Selecione um fornecedor antes de importar o arquivo.");
  }

  if (!(arquivo instanceof File)) {
    throw new Error("Arquivo de importação não enviado.");
  }

  const resultado = await importarPlanilhaFornecedorParaStaging(
    fornecedorId,
    arquivo,
  );

  revalidatePath("/admin/fornecedores/importacoes");
  redirect(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}
