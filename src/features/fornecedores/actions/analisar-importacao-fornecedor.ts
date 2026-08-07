"use server";

import { revalidatePath } from "next/cache";

import { ErroLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { analiseImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import { analisarProdutosImportadosFornecedor } from "../services/analise-produtos-importados.service";

export async function analisarImportacaoFornecedor(formData: FormData) {
  const dados = analiseImportacaoFornecedorSchema.parse({
    importacaoId: formData.get("importacaoId"),
  });

  try {
    await analisarProdutosImportadosFornecedor(dados.importacaoId);
  } catch (erro) {
    console.error("[fornecedores] falha ao analisar produtos da importação", {
      importacaoId: dados.importacaoId,
      momento: new Date().toISOString(),
      erro,
    });

    if (erro instanceof ErroLeituraFornecedores) throw erro;

    throw new Error(
      "Não foi possível atualizar a vinculação agora. Tente novamente em alguns segundos.",
    );
  }

  // A tela de detalhe também precisa ser revalidada: sem ela, o usuário via o botão sair do
  // estado "processando" mas a lista continuava mostrando a vinculação antiga, o que levava
  // a clicar de novo achando que a ação não tinha funcionado.
  revalidatePath(`/admin/fornecedores/importacoes/${dados.importacaoId}`);
  revalidatePath("/admin/fornecedores/importacoes");
}
