"use server";

import { revalidatePath } from "next/cache";

import { possuiSessaoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import {
  desfazerVinculoProdutoRecebidoFornecedorSchema,
  salvarVinculoProdutoRecebidoFornecedorSchema,
} from "../schemas/fornecedores.schema";
import {
  desfazerVinculoProdutoRecebidoFornecedor as desfazerVinculoService,
  salvarVinculoProdutoRecebidoFornecedor as salvarVinculoService,
} from "../services/salvar-vinculo-produto-recebido-fornecedor.service";

const ERRO_SESSAO_FORNECEDOR =
  "Sua sessão não está ativa. Entre novamente para continuar.";

export async function salvarVinculoProdutoRecebidoFornecedor(entrada: unknown) {
  const validacao =
    salvarVinculoProdutoRecebidoFornecedorSchema.safeParse(entrada);

  if (!validacao.success) {
    return { sucesso: false, erro: "Dados inválidos para salvar o vínculo." };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return { sucesso: false, erro: ERRO_SESSAO_FORNECEDOR };
  }

  try {
    const resultado = await salvarVinculoService(validacao.data);
    revalidatePath("/admin/fornecedores");

    return {
      sucesso: true,
      mensagem: "Produto vinculado com sucesso.",
      ...resultado,
    };
  } catch (erro) {
    console.error("[salvarVinculoProdutoRecebidoFornecedor]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return { sucesso: false, erro: "Não foi possível salvar o vínculo." };
  }
}

export async function desfazerVinculoProdutoRecebidoFornecedor(
  entrada: unknown,
) {
  const validacao =
    desfazerVinculoProdutoRecebidoFornecedorSchema.safeParse(entrada);

  if (!validacao.success) {
    return { sucesso: false, erro: "Vínculo inválido para desfazer." };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return { sucesso: false, erro: ERRO_SESSAO_FORNECEDOR };
  }

  try {
    await desfazerVinculoService(validacao.data);
    revalidatePath("/admin/fornecedores");

    return { sucesso: true, mensagem: "Vínculo desfeito." };
  } catch (erro) {
    console.error("[desfazerVinculoProdutoRecebidoFornecedor]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return { sucesso: false, erro: "Não foi possível desfazer o vínculo." };
  }
}
