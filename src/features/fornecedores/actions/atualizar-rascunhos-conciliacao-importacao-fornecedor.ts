"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { produtoRascunhosTable } from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { ajustarPrecosProdutosRascunhosFornecedor } from "@/features/fornecedores/services/ajustar-precos-produtos-rascunhos-fornecedor.service";
import { atualizarCamposProdutosRascunhosFornecedor } from "@/features/fornecedores/services/atualizar-campos-produtos-rascunhos-fornecedor.service";

const PROVEDOR_IMPORTACAO_EXCEL = "arquivo_excel";

const idsRascunhosSchema = z.array(z.uuid()).min(1).max(200);
const secoesLojaSchema = z
  .array(z.enum(["general", "new", "sale", "featured", "bestseller"]))
  .min(1);

const ajustarPrecosRascunhosImportacaoFornecedorSchema = z.object({
  rascunhoIds: idsRascunhosSchema,
  operacao: z.enum([
    "aumentar_percentual",
    "diminuir_percentual",
    "somar_valor_fixo",
    "definir_valor_fixo",
  ]),
  valor: z.number().nonnegative(),
});

const atualizarCamposRascunhosImportacaoFornecedorSchema = z.discriminatedUnion(
  "campo",
  [
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
  ],
);

async function listarIdsRascunhosDaImportacao(
  importacaoId: string,
  rascunhoIds: string[],
) {
  const idsUnicos = Array.from(new Set(rascunhoIds));
  const rascunhos = await db
    .select({ id: produtoRascunhosTable.id })
    .from(produtoRascunhosTable)
    .where(
      and(
        inArray(produtoRascunhosTable.id, idsUnicos),
        eq(produtoRascunhosTable.origemTipo, "fornecedor_excel"),
        eq(produtoRascunhosTable.origemProvedor, PROVEDOR_IMPORTACAO_EXCEL),
        sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
      ),
    );

  return rascunhos.map((rascunho) => rascunho.id);
}

function revalidarConciliacaoImportacao(importacaoId: string) {
  revalidatePath(`/admin/fornecedores/importacoes/${importacaoId}`);
}

export async function ajustarPrecosRascunhosImportacaoFornecedor(
  importacaoId: string,
  entrada: unknown,
) {
  const idValidado = z.uuid().safeParse(importacaoId);
  const validacao =
    ajustarPrecosRascunhosImportacaoFornecedorSchema.safeParse(entrada);

  if (!idValidado.success || !validacao.success) {
    return { sucesso: false, erro: "Dados inválidos para ajustar os preços." };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para ajustar os preços.",
    };
  }

  try {
    const rascunhoIds = await listarIdsRascunhosDaImportacao(
      idValidado.data,
      validacao.data.rascunhoIds,
    );

    if (rascunhoIds.length !== new Set(validacao.data.rascunhoIds).size) {
      return {
        sucesso: false,
        erro: "Um ou mais rascunhos não pertencem a esta importação.",
      };
    }

    const precosAtualizados = await ajustarPrecosProdutosRascunhosFornecedor({
      rascunhoIds,
      origemProvedor: PROVEDOR_IMPORTACAO_EXCEL,
      operacao: validacao.data.operacao,
      valor: validacao.data.valor,
    });

    revalidarConciliacaoImportacao(idValidado.data);

    return {
      sucesso: true,
      mensagem: "Preços de loja atualizados nos rascunhos selecionados.",
      precosAtualizados,
    };
  } catch (erro) {
    console.error("[ajustarPrecosRascunhosImportacaoFornecedor]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível ajustar os preços agora.",
    };
  }
}

export async function atualizarCamposRascunhosImportacaoFornecedor(
  importacaoId: string,
  entrada: unknown,
) {
  const idValidado = z.uuid().safeParse(importacaoId);
  const validacao =
    atualizarCamposRascunhosImportacaoFornecedorSchema.safeParse(entrada);

  if (!idValidado.success || !validacao.success) {
    return {
      sucesso: false,
      erro: "Dados inválidos para alterar os rascunhos.",
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para continuar.",
    };
  }

  try {
    const rascunhoIds = await listarIdsRascunhosDaImportacao(
      idValidado.data,
      validacao.data.rascunhoIds,
    );

    if (rascunhoIds.length !== new Set(validacao.data.rascunhoIds).size) {
      return {
        sucesso: false,
        erro: "Um ou mais rascunhos não pertencem a esta importação.",
      };
    }

    const atualizados = await atualizarCamposProdutosRascunhosFornecedor({
      ...validacao.data,
      rascunhoIds,
      origemProvedor: PROVEDOR_IMPORTACAO_EXCEL,
    });

    revalidarConciliacaoImportacao(idValidado.data);

    return {
      sucesso: true,
      mensagem: `${atualizados.length} rascunho${atualizados.length === 1 ? " atualizado" : "s atualizados"}.`,
    };
  } catch (erro) {
    console.error("[atualizarCamposRascunhosImportacaoFornecedor]", {
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
