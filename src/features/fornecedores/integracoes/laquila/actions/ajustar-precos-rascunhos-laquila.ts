"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import {
  ajustarPrecosProdutosRascunhosFornecedor,
  atualizarPrecoLojaProdutoRascunhoFornecedor,
} from "@/features/fornecedores/services/ajustar-precos-produtos-rascunhos-fornecedor.service";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

const ajustarPrecosRascunhosLaquilaSchema = z.object({
  rascunhoIds: z.array(z.uuid()).min(1),
  operacao: z.enum([
    "aumentar_percentual",
    "diminuir_percentual",
    "somar_valor_fixo",
    "definir_valor_fixo",
  ]),
  valor: z.number().nonnegative(),
});

const atualizarPrecoLojaRascunhoLaquilaSchema = z.object({
  rascunhoId: z.uuid(),
  precoLoja: z.number().nonnegative(),
});

type ResultadoAjustarPrecosRascunhosLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  totalAtualizado?: number;
  precosAtualizados?: Array<{ rascunhoId: string; precoLoja: string }>;
};

export async function ajustarPrecosRascunhosLaquila(
  entrada: unknown,
): Promise<ResultadoAjustarPrecosRascunhosLaquila> {
  const validacao = ajustarPrecosRascunhosLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Dados inválidos para ajustar preços.",
    };
  }

  const sessaoValida = await possuiSessaoFornecedoresAdmin();

  if (!sessaoValida) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para ajustar preços.",
    };
  }

  try {
    const precosAtualizados = await ajustarPrecosProdutosRascunhosFornecedor({
      rascunhoIds: validacao.data.rascunhoIds,
      origemProvedor: PROVEDOR_INTEGRACAO_LAQUILA,
      operacao: validacao.data.operacao,
      valor: validacao.data.valor,
    });

    revalidatePath("/admin/fornecedores/integracoes/laquila/conciliacao");

    return {
      sucesso: true,
      mensagem: "Preços de loja atualizados nos rascunhos selecionados.",
      totalAtualizado: precosAtualizados.length,
      precosAtualizados,
    };
  } catch (erro) {
    console.error("[ajustarPrecosRascunhosLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível ajustar os preços agora.",
    };
  }
}

export async function atualizarPrecoLojaRascunhoLaquila(entrada: unknown) {
  const validacao = atualizarPrecoLojaRascunhoLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Preço de loja inválido para o rascunho.",
    };
  }

  const sessaoValida = await possuiSessaoFornecedoresAdmin();

  if (!sessaoValida) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para atualizar o preço.",
    };
  }

  try {
    await atualizarPrecoLojaProdutoRascunhoFornecedor({
      rascunhoId: validacao.data.rascunhoId,
      origemProvedor: PROVEDOR_INTEGRACAO_LAQUILA,
      precoLoja: validacao.data.precoLoja,
    });

    revalidatePath("/admin/fornecedores/integracoes/laquila/conciliacao");

    return {
      sucesso: true,
      mensagem: "Preço de loja atualizado.",
    };
  } catch (erro) {
    console.error("[atualizarPrecoLojaRascunhoLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível atualizar o preço de loja.",
    };
  }
}
