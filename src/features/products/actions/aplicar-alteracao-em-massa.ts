"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";

import {
  productPricingTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { validarAcessoAdmin } from "@/features/autenticacao/actions/validar-acesso-admin";

import { validarAssinaturaPreview } from "../lib/alteracao-em-massa/assinatura-preview-alteracao-em-massa";
import { calcularPlanoAlteracaoEmMassa } from "../lib/alteracao-em-massa/calcular-preview-alteracao-em-massa";
import {
  compararVersaoEntidade,
  localizarConflitoProduto,
  type ConflitoConcorrenciaAlteracaoEmMassa,
} from "../lib/alteracao-em-massa/concorrencia-alteracao-em-massa";
import { listarDadosAlteracaoEmMassa } from "../queries/alteracao-em-massa/listar-dados-alteracao-em-massa";
import {
  aplicarAlteracaoEmMassaSchema,
  solicitarPreviewAlteracaoEmMassaSchema,
} from "../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type { ResultadoAplicacaoAlteracaoEmMassa } from "../types/resultado-alteracao-em-massa.types";

const LIMITE_LOTE_ALTERACAO_EM_MASSA = 25;

function revalidarPathAlteracaoEmMassa(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (erro) {
    console.warn("[produtos:alteracao-em-massa:revalidacao]", {
      path,
      tipo: erro instanceof Error ? erro.name : "Erro desconhecido",
    });
  }
}

class ErroConcorrenciaAlteracaoEmMassa extends Error {
  constructor(
    readonly produtoId: string,
    readonly diagnostico: ConflitoConcorrenciaAlteracaoEmMassa,
  ) {
    super(diagnostico.mensagem);
  }
}

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
    return {
      sucesso: false as const,
      erro: "Não foi possível validar os produtos antes da escrita. Nenhuma alteração foi aplicada.",
      tipoErro: "aplicacao" as const,
      etapa: "carregamento_essencial_antes_da_transacao" as const,
    };
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
    divergentes.length > 0
  ) {
    const detalhesConflitos: ResultadoAplicacaoAlteracaoEmMassa["detalhes"] =
      divergentes.map((plano) => {
        const diagnostico = localizarConflitoProduto(
          assinatura.versoes[plano.produto.id],
          plano.produto,
        );
        return {
          produtoId: plano.produto.id,
          produto: plano.produto.nome,
          sku: plano.produto.sku,
          resultado: "erro" as const,
          mensagem:
            diagnostico?.mensagem ??
            "Os dados do produto mudaram após o preview.",
          entidade: diagnostico?.entidade ?? "produto",
          campoVersao: diagnostico?.campoVersao,
          versaoEsperada: diagnostico?.versaoEsperada,
          versaoEncontrada: diagnostico?.versaoEncontrada,
          etapa: diagnostico?.etapa ?? "validacao_antes_da_escrita",
          orientacao:
            diagnostico?.orientacao ??
            "Gere um novo preview para revisar os valores atuais.",
          conflitoConcorrencia: true,
        };
      });
    return {
      sucesso: false as const,
      erro: "Os dados mudaram ou existem conflitos. Gere um novo preview.",
      requerNovoPreview: true as const,
      resultado: {
        status: "falha" as const,
        alterados: 0,
        ignorados: 0,
        semMudanca: 0,
        erros: detalhesConflitos.length,
        detalhes: detalhesConflitos,
      },
      produtosComConflito: [
        ...new Set([
          ...produtosIds.filter((id) => !encontrados.has(id)),
          ...divergentes.map((plano) => plano.produto.id),
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
      !plano.linhas.some((linha) => linha.resultado === "conflito") &&
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
      sku: plano.produto.sku,
      resultado: "ignorado" as const,
      mensagem: "Produto com variantes ignorado.",
    })),
    ...semMudanca.map((plano) => ({
      produtoId: plano.produto.id,
      produto: plano.produto.nome,
      sku: plano.produto.sku,
      resultado: "sem_alteracao" as const,
    })),
    ...conflitos.map((plano) => ({
      produtoId: plano.produto.id,
      produto: plano.produto.nome,
      sku: plano.produto.sku,
      resultado: "erro" as const,
      mensagem:
        plano.linhas.find((linha) => linha.resultado === "conflito")?.motivo ??
        "O produto não é elegível para esta alteração.",
      entidade: "preco" as const,
      etapa: "validacao_da_modalidade",
      orientacao:
        "Cadastre a modalidade no produto individualmente antes de alterar seu prazo em massa.",
    })),
  ];

  let alterados = 0;
  let erros = conflitos.length;
  const produtosAlteradosIds = new Set<string>();
  for (const lote of dividirEmLotes(
    aplicaveis,
    LIMITE_LOTE_ALTERACAO_EM_MASSA,
  )) {
    try {
      await dbTransacional.transaction(async (tx) => {
        const agora = new Date();

        // Todas as versões são validadas sob lock antes da primeira escrita.
        // Assim, uma atualização deste próprio lote nunca vira conflito.
        for (const plano of lote) {
          const [produtoBloqueado] = await tx
            .select({
              id: productTable.id,
              tipoProduto: productTable.productKind,
              versao: sql<string>`${productTable.updatedAt}::text`,
            })
            .from(productTable)
            .where(eq(productTable.id, plano.produto.id))
            .for("update");
          const conflitoProduto = compararVersaoEntidade({
            entidade: "produto",
            esperada: plano.produto.versaoConcorrencia,
            encontrada: produtoBloqueado?.versao ?? "produto não encontrado",
          });
          if (!produtoBloqueado || produtoBloqueado.tipoProduto !== "simple") {
            throw new ErroConcorrenciaAlteracaoEmMassa(
              plano.produto.id,
              conflitoProduto ?? {
                entidade: "produto",
                campoVersao: "updatedAt",
                versaoEsperada: plano.produto.versaoConcorrencia,
                versaoEncontrada: "produto indisponível ou não simples",
                etapa: "validacao_antes_da_escrita",
                mensagem:
                  "O produto não está mais disponível para esta operação.",
                orientacao:
                  "Gere um novo preview para revisar os produtos elegíveis.",
              },
            );
          }
          if (conflitoProduto) {
            throw new ErroConcorrenciaAlteracaoEmMassa(
              plano.produto.id,
              conflitoProduto,
            );
          }

          const idsPrecos = plano.alteracoes.precos.map(
            (preco) => preco.precoId,
          );
          if (idsPrecos.length) {
            const precosBloqueados = await tx
              .select({
                id: productPricingTable.id,
                versao: sql<string>`${productPricingTable.updatedAt}::text`,
              })
              .from(productPricingTable)
              .where(inArray(productPricingTable.id, idsPrecos))
              .for("update");
            for (const alteracaoPreco of plano.alteracoes.precos) {
              const esperado = plano.produto.precosModalidades.find(
                (preco) => preco.id === alteracaoPreco.precoId,
              );
              const encontrado = precosBloqueados.find(
                (preco) => preco.id === alteracaoPreco.precoId,
              );
              const conflito = compararVersaoEntidade({
                entidade: "preco",
                esperada: esperado?.versaoConcorrencia ?? "preço inexistente",
                encontrada: encontrado?.versao ?? "preço não encontrado",
                modalidade: alteracaoPreco.modalidade,
              });
              if (conflito) {
                throw new ErroConcorrenciaAlteracaoEmMassa(
                  plano.produto.id,
                  conflito,
                );
              }
            }
          }

          if (plano.alteracoes.estoque) {
            const [varianteBloqueada] = await tx
              .select({
                id: productVariantTable.id,
                versao: sql<string>`${productVariantTable.updatedAt}::text`,
              })
              .from(productVariantTable)
              .where(
                and(
                  eq(
                    productVariantTable.id,
                    plano.alteracoes.estoque.varianteId,
                  ),
                  eq(productVariantTable.productId, plano.produto.id),
                ),
              )
              .for("update");
            const conflito = compararVersaoEntidade({
              entidade: "estoque",
              esperada:
                plano.produto.varianteTecnicaVersaoConcorrencia ??
                "variante inexistente",
              encontrada:
                varianteBloqueada?.versao ?? "variante não encontrada",
            });
            if (conflito) {
              throw new ErroConcorrenciaAlteracaoEmMassa(
                plano.produto.id,
                conflito,
              );
            }
          }
        }

        for (const plano of lote) {
          const mudancas = plano.alteracoes.produto;
          if (Object.keys(mudancas).length > 0) {
            await tx
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
                  eq(productTable.productKind, "simple"),
                ),
              );
          }

          for (const preco of plano.alteracoes.precos) {
            await tx
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
              .where(eq(productPricingTable.id, preco.precoId));
          }

          if (plano.alteracoes.estoque) {
            await tx
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
                ),
              );
          }
        }
      });

      alterados += lote.length;
      lote.forEach((plano) => produtosAlteradosIds.add(plano.produto.id));
      detalhes.push(
        ...lote.map((plano) => ({
          produtoId: plano.produto.id,
          produto: plano.produto.nome,
          sku: plano.produto.sku,
          resultado: "alterado" as const,
        })),
      );
    } catch (erro) {
      console.error("[produtos:alteracao-em-massa:aplicar-lote]", {
        produtosIds: lote.map((plano) => plano.produto.id),
        mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
        ...(erro instanceof ErroConcorrenciaAlteracaoEmMassa && {
          produtoId: erro.produtoId,
          entidade: erro.diagnostico.entidade,
          campoVersao: erro.diagnostico.campoVersao,
          versaoEsperada: erro.diagnostico.versaoEsperada,
          versaoEncontrada: erro.diagnostico.versaoEncontrada,
          etapa: erro.diagnostico.etapa,
        }),
      });
      erros += lote.length;
      detalhes.push(
        ...lote.map((plano) => ({
          produtoId: plano.produto.id,
          produto: plano.produto.nome,
          sku: plano.produto.sku,
          resultado: "erro" as const,
          ...(erro instanceof ErroConcorrenciaAlteracaoEmMassa &&
          erro.produtoId === plano.produto.id
            ? {
                mensagem: erro.diagnostico.mensagem,
                entidade: erro.diagnostico.entidade,
                campoVersao: erro.diagnostico.campoVersao,
                versaoEsperada: erro.diagnostico.versaoEsperada,
                versaoEncontrada: erro.diagnostico.versaoEncontrada,
                etapa: erro.diagnostico.etapa,
                orientacao: erro.diagnostico.orientacao,
                conflitoConcorrencia: true,
              }
            : {
                mensagem:
                  "O lote foi desfeito porque outro produto apresentou conflito.",
                entidade: "lote" as const,
                etapa: "rollback_do_lote",
                orientacao: "Gere um novo preview antes de tentar novamente.",
                conflitoConcorrencia:
                  erro instanceof ErroConcorrenciaAlteracaoEmMassa,
              }),
        })),
      );
    }
  }

  if (produtosAlteradosIds.size > 0) {
    revalidarPathAlteracaoEmMassa("/admin/products");
    revalidarPathAlteracaoEmMassa("/admin/products/alteracao-em-massa");
    revalidarPathAlteracaoEmMassa("/");
    revalidarPathAlteracaoEmMassa("/category/[slug]", "page");

    planos
      .filter((plano) => produtosAlteradosIds.has(plano.produto.id))
      .forEach((plano) =>
        revalidarPathAlteracaoEmMassa(`/product/${plano.produto.slug}`),
      );
  }
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
