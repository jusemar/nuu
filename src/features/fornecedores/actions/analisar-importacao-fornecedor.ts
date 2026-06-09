"use server";

import { revalidatePath } from "next/cache";

import { analiseImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import { analisarProdutosImportadosFornecedor } from "../services/analise-produtos-importados.service";

export async function analisarImportacaoFornecedor(formData: FormData) {
  const dados = analiseImportacaoFornecedorSchema.parse({
    importacaoId: formData.get("importacaoId"),
  });

  await analisarProdutosImportadosFornecedor(dados.importacaoId);

  revalidatePath("/admin/fornecedores/importacoes");
}
