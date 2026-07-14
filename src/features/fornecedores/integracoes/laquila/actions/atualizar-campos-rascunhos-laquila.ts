"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { atualizarCamposProdutosRascunhosFornecedor } from "@/features/fornecedores/services/atualizar-campos-produtos-rascunhos-fornecedor.service";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

const idsRascunhosSchema = z.array(z.uuid()).min(1).max(200);
const secoesLojaSchema = z
  .array(z.enum(["general", "new", "sale", "featured", "bestseller"]))
  .min(1);

const atualizarCamposRascunhosLaquilaSchema = z.discriminatedUnion("campo", [
  z.object({
    rascunhoIds: idsRascunhosSchema,
    campo: z.literal("categoria"),
    categoriaId: z.uuid(),
  }),
  z.object({
    rascunhoIds: idsRascunhosSchema,
    campo: z.literal("marca"),
    marcaId: z.uuid(),
  }),
  z.object({
    rascunhoIds: idsRascunhosSchema,
    campo: z.literal("preco_loja"),
    precoLoja: z.number().nonnegative(),
  }),
  z.object({
    rascunhoIds: idsRascunhosSchema,
    campo: z.literal("secoes_loja"),
    secoesLoja: secoesLojaSchema,
  }),
  z.object({
    rascunhoIds: idsRascunhosSchema,
    campo: z.literal("modalidade_comercial"),
    modalidade: z.enum(["stock", "pre_sale", "dropshipping", "order_basis"]),
  }),
  z.object({
    rascunhoIds: idsRascunhosSchema,
    campo: z.literal("prazo_entrega"),
    prazoEntrega: z.string().trim().min(1).max(160),
  }),
]);

export async function atualizarCamposRascunhosLaquila(entrada: unknown) {
  const validacao = atualizarCamposRascunhosLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Dados inválidos para alterar os rascunhos.",
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para continuar.",
    };
  }

  try {
    const atualizados = await atualizarCamposProdutosRascunhosFornecedor({
      ...validacao.data,
      origemProvedor: PROVEDOR_INTEGRACAO_LAQUILA,
    });

    revalidatePath("/admin/fornecedores/integracoes/laquila/conciliacao");

    return {
      sucesso: true,
      mensagem: `${atualizados.length} rascunho${atualizados.length === 1 ? " atualizado" : "s atualizados"}.`,
      totalAtualizado: atualizados.length,
    };
  } catch (erro) {
    console.error("[atualizarCamposRascunhosLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro:
        erro instanceof Error &&
        ["Categoria não encontrada.", "Marca não encontrada."].includes(
          erro.message,
        )
          ? erro.message
          : "Não foi possível alterar os rascunhos agora.",
    };
  }
}
