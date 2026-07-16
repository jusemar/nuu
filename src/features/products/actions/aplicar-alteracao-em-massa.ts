"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import {
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { validarAcessoAdmin } from "@/features/autenticacao/actions/validar-acesso-admin";

import { validarAssinaturaPreview } from "../lib/alteracao-em-massa/assinatura-preview-alteracao-em-massa";
import { calcularPlanoAlteracaoEmMassa } from "../lib/alteracao-em-massa/calcular-preview-alteracao-em-massa";
import { listarDadosAlteracaoEmMassa } from "../queries/alteracao-em-massa/listar-dados-alteracao-em-massa";
import {
  aplicarAlteracaoEmMassaSchema,
  solicitarPreviewAlteracaoEmMassaSchema,
} from "../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type { ResultadoAplicacaoAlteracaoEmMassa } from "../types/resultado-alteracao-em-massa.types";

const LIMITE_LOTE_ALTERACAO_EM_MASSA = 25;

class ErroConcorrenciaAlteracaoEmMassa extends Error {}

function dividirEmLotes<T>(itens: T[], tamanho: number) {
  return Array.from(
    { length: Math.ceil(itens.length / tamanho) },
    (_, indice) => itens.slice(indice * tamanho, (indice + 1) * tamanho),
  );
}

export async function aplicarAlteracaoEmMassa(input: unknown) {
  const acesso = await validarAcessoAdmin();
  if (!acesso.sucesso) return { sucesso: false as const, erro: acesso.erro };

  const validacao = aplicarAlteracaoEmMassaSchema.safeParse(input);
  if (!validacao.success) {
    return { sucesso: false as const, erro: "Configuração inválida." };
  }

  const { produtosIds, operacoes, assinaturaPreview } = validacao.data;
  const assinatura = validarAssinaturaPreview(assinaturaPreview);
  const conteudoAssinado = solicitarPreviewAlteracaoEmMassaSchema.safeParse(
    assinatura && {
      produtosIds: assinatura.produtosIds,
      operacoes: assinatura.operacoes,
    },
  );
  if (
    !assinatura ||
    !conteudoAssinado.success ||
    JSON.stringify(conteudoAssinado.data) !==
      JSON.stringify({ produtosIds, operacoes })
  ) {
    return {
      sucesso: false as const,
      erro: "O preview expirou ou não corresponde à configuração atual.",
      requerNovoPreview: true as const,
    };
  }

  const resultadoDados = await listarDadosAlteracaoEmMassa(produtosIds);
  if (!resultadoDados.sucesso) {
    return { sucesso: false as const, erro: resultadoDados.erro };
  }
  const planos = calcularPlanoAlteracaoEmMassa(
    resultadoDados.dados.produtos,
    operacoes,
    resultadoDados.dados,
  );
  const encontrados = new Set(planos.map((plano) => plano.produto.id));
  const divergentes = planos.filter(
    (plano) => assinatura.versoes[plano.produto.id] !== plano.versao,
  );
  const conflitos = planos.filter((plano) =>
    plano.linhas.some((linha) => linha.resultado === "conflito"),
  );
  if (
    produtosIds.some((id) => !encontrados.has(id)) ||
    divergentes.length > 0 ||
    conflitos.length > 0
  ) {
    return {
      sucesso: false as const,
      erro: "Os dados mudaram ou existem conflitos. Gere um novo preview.",
      requerNovoPreview: true as const,
      produtosComConflito: [
        ...new Set([
          ...produtosIds.filter((id) => !encontrados.has(id)),
          ...divergentes.map((plano) => plano.produto.id),
          ...conflitos.map((plano) => plano.produto.id),
        ]),
      ],
    };
  }

  const ignorados = planos.filter(
    (plano) => plano.produto.tipoProduto !== "simple",
  );
  const semMudanca = planos.filter(
    (plano) =>
      plano.produto.tipoProduto === "simple" &&
      !plano.linhas.some((linha) => linha.resultado === "alterado"),
  );
  const aplicaveis = planos.filter(
    (plano) =>
      plano.produto.tipoProduto === "simple" &&
      plano.linhas.some((linha) => linha.resultado === "alterado"),
  );

  const detalhes: ResultadoAplicacaoAlteracaoEmMassa["detalhes"] = [
    ...ignorados.map((plano) => ({
      produtoId: plano.produto.id,
      produto: plano.produto.nome,
      resultado: "ignorado" as const,
      mensagem: "Produto com variantes ignorado.",
    })),
    ...semMudanca.map((plano) => ({
      produtoId: plano.produto.id,
      produto: plano.produto.nome,
      resultado: "sem_alteracao" as const,
    })),
  ];

  let alterados = 0;
  let erros = 0;
  for (const lote of dividirEmLotes(
    aplicaveis,
    LIMITE_LOTE_ALTERACAO_EM_MASSA,
  )) {
    try {
      await dbTransacional.transaction(async (tx) => {
        const agora = new Date();
        for (const plano of lote) {
          const mudancas = plano.alteracoes.produto;
          const [produtoAtualizado] = await tx
            .update(productTable)
            .set({
              ...(mudancas.ativo !== undefined && {
                isActive: mudancas.ativo,
              }),
              ...(mudancas.categoriaId !== undefined && {
                categoryId: mudancas.categoriaId,
              }),
              ...(mudancas.marcaId !== undefined && {
                marcaId: mudancas.marcaId,
                brand: mudancas.marcaNome,
              }),
              ...(mudancas.secoesLoja !== undefined && {
                storeProductFlags: mudancas.secoesLoja,
              }),
              ...(mudancas.ncm !== undefined && { ncmCode: mudancas.ncm }),
              ...(mudancas.pesoEmGramas !== undefined && {
                weight: mudancas.pesoEmGramas,
              }),
              ...(mudancas.alturaEmCm !== undefined && {
                height: mudancas.alturaEmCm,
              }),
              ...(mudancas.larguraEmCm !== undefined && {
                width: mudancas.larguraEmCm,
              }),
              ...(mudancas.comprimentoEmCm !== undefined && {
                length: mudancas.comprimentoEmCm,
              }),
              updatedAt: agora,
            })
            .where(
              and(
                eq(productTable.id, plano.produto.id),
                eq(productTable.updatedAt, plano.produto.atualizadoEm),
                eq(productTable.productKind, "simple"),
              ),
            )
            .returning({ id: productTable.id });
          if (!produtoAtualizado) {
            throw new ErroConcorrenciaAlteracaoEmMassa(
              "Produto alterado durante a aplicação.",
            );
          }

          for (const preco of plano.alteracoes.precos) {
            const atual = plano.produto.precosModalidades.find(
              (item) => item.id === preco.precoId,
            );
            if (!atual) throw new ErroConcorrenciaAlteracaoEmMassa();
            const [precoAtualizado] = await tx
              .update(productPricingTable)
              .set({
                ...(preco.precoEmCentavos !== undefined && {
                  price: preco.precoEmCentavos,
                }),
                ...(preco.prazo !== undefined && {
                  deliveryDays: preco.prazo,
                }),
                updatedAt: agora,
              })
              .where(
                and(
                  eq(productPricingTable.id, preco.precoId),
                  eq(productPricingTable.updatedAt, atual.atualizadoEm),
                ),
              )
              .returning({ id: productPricingTable.id });
            if (!precoAtualizado) throw new ErroConcorrenciaAlteracaoEmMassa();
          }

          if (plano.alteracoes.estoque) {
            const [varianteAtualizada] = await tx
              .update(productVariantTable)
              .set({
                stockQuantity: plano.alteracoes.estoque.quantidade,
                updatedAt: agora,
              })
              .where(
                and(
                  eq(
                    productVariantTable.id,
                    plano.alteracoes.estoque.varianteId,
                  ),
                  eq(productVariantTable.productId, plano.produto.id),
                  eq(
                    productVariantTable.updatedAt,
                    plano.produto.varianteTecnicaAtualizadaEm!,
                  ),
                ),
              )
              .returning({ id: productVariantTable.id });
            if (!varianteAtualizada) {
              throw new ErroConcorrenciaAlteracaoEmMassa();
            }
          }
        }
      });

      alterados += lote.length;
      detalhes.push(
        ...lote.map((plano) => ({
          produtoId: plano.produto.id,
          produto: plano.produto.nome,
          resultado: "alterado" as const,
        })),
      );
    } catch (erro) {
      console.error("[produtos:alteracao-em-massa:aplicar-lote]", {
        produtosIds: lote.map((plano) => plano.produto.id),
        mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
      });
      erros += lote.length;
      detalhes.push(
        ...lote.map((plano) => ({
          produtoId: plano.produto.id,
          produto: plano.produto.nome,
          resultado: "erro" as const,
          mensagem:
            erro instanceof ErroConcorrenciaAlteracaoEmMassa
              ? "Dados alterados durante a aplicação."
              : "Falha ao aplicar este lote.",
        })),
      );
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/alteracao-em-massa");
  revalidatePath("/", "layout");
  const resultado: ResultadoAplicacaoAlteracaoEmMassa = {
    status: erros === 0 ? "sucesso" : alterados > 0 ? "parcial" : "falha",
    alterados,
    ignorados: ignorados.length,
    semMudanca: semMudanca.length,
    erros,
    detalhes,
  };
  return {
    sucesso: erros === 0,
    resultado,
    erro: erros ? "Alguns produtos não puderam ser alterados." : undefined,
  } as const;
}
