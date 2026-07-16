"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import {
  alterarDecisaoRascunhosImportacaoFornecedorService,
  ErroDecisaoRascunhoFornecedor,
} from "@/features/fornecedores/services/alterar-decisao-rascunhos-importacao-fornecedor.service";

const alterarDecisaoRascunhosImportacaoFornecedorSchema = z.object({
  rascunhoIds: z.array(z.uuid()).min(1).max(100),
  acao: z.enum(["ignorar", "desfazer"]),
});

export async function alterarDecisaoRascunhosImportacaoFornecedor(
  importacaoId: string,
  entrada: unknown,
) {
  const idValidado = z.uuid().safeParse(importacaoId);
  const validacao =
    alterarDecisaoRascunhosImportacaoFornecedorSchema.safeParse(entrada);

  if (!idValidado.success || !validacao.success) {
    return {
      sucesso: false,
      erro: "Selecione ao menos um rascunho válido.",
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão expirou. Entre novamente para alterar os rascunhos.",
    };
  }

  const idImportacao = idValidado.data;
  const rascunhoIds = Array.from(new Set(validacao.data.rascunhoIds));

  try {
    const resultado = await alterarDecisaoRascunhosImportacaoFornecedorService({
      importacaoId: idImportacao,
      rascunhoIds,
      acao: validacao.data.acao,
    });

    revalidatePath(`/admin/fornecedores/importacoes/${idImportacao}`);
    revalidatePath(
      `/admin/fornecedores/importacoes/${idImportacao}/publicacao`,
    );

    return {
      sucesso: true,
      mensagem:
        resultado.acao === "ignorar"
          ? `${resultado.totalAtualizados} item${resultado.totalAtualizados === 1 ? " ignorado" : "s ignorados"}.`
          : `${resultado.totalAtualizados} item${resultado.totalAtualizados === 1 ? " voltou" : "s voltaram"} para Vinculação.`,
    };
  } catch (erro) {
    console.error("[alterarDecisaoRascunhosImportacaoFornecedor]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro:
        erro instanceof ErroDecisaoRascunhoFornecedor
          ? erro.message
          : "Não foi possível alterar os itens selecionados.",
    };
  }
}
