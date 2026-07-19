import "server-only";

import { asc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  marcaTable,
  modelosRetiradaTable,
  productPricingTable,
  productTable,
  productVariantTable,
  produtosTiposLogisticosTable,
  tiposLogisticosTable,
} from "@/db/schema";

import { normalizarModalidadePreco } from "../../constants/modalidades-preco";
import type { ResultadoAlteracaoEmMassa } from "../../types/alteracao-em-massa.types";

const DADOS_VAZIOS = {
  produtos: [],
  categorias: [],
  marcas: [],
  classificacoesLogisticas: [],
  modelosRetirada: [],
};

function diagnosticarErroBanco(erro: unknown) {
  const causa =
    erro instanceof Error && "cause" in erro
      ? (erro as Error & { cause?: unknown }).cause
      : undefined;
  return {
    mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    causa: causa instanceof Error ? causa.message : String(causa ?? "—"),
    codigo:
      typeof causa === "object" && causa && "code" in causa
        ? String(causa.code)
        : typeof erro === "object" && erro && "code" in erro
          ? String(erro.code)
          : undefined,
  };
}

/**
 * Carrega somente os dados necessários para a primeira fase da tela.
 * Não executa escrita e não reutiliza actions de atualização de produtos.
 */
export async function listarDadosAlteracaoEmMassa(
  produtosIds?: string[],
): Promise<ResultadoAlteracaoEmMassa> {
  try {
    const carregamentoAplicacao = Boolean(produtosIds?.length);
    const produtos = await db
      .select({
        id: productTable.id,
        nome: productTable.name,
        slug: productTable.slug,
        sku: productTable.sku,
        ativo: productTable.isActive,
        categoriaId: productTable.categoryId,
        categoriaNome: categoryTable.name,
        marcaId: productTable.marcaId,
        marcaNome: marcaTable.nome,
        tipoProduto: productTable.productKind,
        ncm: productTable.ncmCode,
        pesoEmGramas: productTable.weight,
        alturaEmCm: productTable.height,
        larguraEmCm: productTable.width,
        comprimentoEmCm: productTable.length,
        permiteRetirada: productTable.allowsPickup,
        permiteEntregaPropria: productTable.allowsOwnDelivery,
        modeloRetiradaId: productTable.modeloRetiradaId,
        atualizadoEm: productTable.updatedAt,
        versaoConcorrencia: sql<string>`${productTable.updatedAt}::text`.as(
          "produto_versao_concorrencia",
        ),
      })
      .from(productTable)
      .innerJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
      .innerJoin(marcaTable, eq(productTable.marcaId, marcaTable.id))
      .where(
        produtosIds?.length ? inArray(productTable.id, produtosIds) : undefined,
      )
      .orderBy(asc(productTable.name));

    const carregarCategorias = db
      .select({
        id: categoryTable.id,
        nome: categoryTable.name,
        parentId: categoryTable.parentId,
        nivel: categoryTable.level,
        ordem: categoryTable.orderIndex,
        ativa: categoryTable.isActive,
      })
      .from(categoryTable)
      .orderBy(
        asc(categoryTable.level),
        asc(categoryTable.orderIndex),
        asc(categoryTable.name),
      );
    const carregarClassificacoes = carregamentoAplicacao
      ? Promise.resolve([])
      : db
          .select({
            id: tiposLogisticosTable.id,
            nome: tiposLogisticosTable.nome,
            descricao: tiposLogisticosTable.descricao,
          })
          .from(tiposLogisticosTable)
          .where(eq(tiposLogisticosTable.ativo, true))
          .orderBy(asc(tiposLogisticosTable.nome));
    const carregarModelosRetirada = carregamentoAplicacao
      ? Promise.resolve([])
      : db
          .select({
            id: modelosRetiradaTable.id,
            nome: modelosRetiradaTable.nome,
            prazoTexto: modelosRetiradaTable.prazoTexto,
            mensagem: modelosRetiradaTable.mensagem,
          })
          .from(modelosRetiradaTable)
          .where(eq(modelosRetiradaTable.ativo, true))
          .orderBy(asc(modelosRetiradaTable.nome));

    const [resultadoCategorias, resultadoClassificacoes, resultadoModelos] =
      await Promise.allSettled([
        carregarCategorias,
        carregarClassificacoes,
        carregarModelosRetirada,
      ]);
    const categorias =
      resultadoCategorias.status === "fulfilled"
        ? resultadoCategorias.value
        : [];
    const classificacoesLogisticas =
      resultadoClassificacoes.status === "fulfilled"
        ? resultadoClassificacoes.value
        : [];
    const modelosRetirada =
      resultadoModelos.status === "fulfilled" ? resultadoModelos.value : [];
    const avisos: NonNullable<ResultadoAlteracaoEmMassa["dados"]["avisos"]> =
      {};

    if (resultadoCategorias.status === "rejected") {
      console.error("[produtos:alteracao-em-massa:listar-categorias]", {
        operacao: "listar_categorias",
        ...diagnosticarErroBanco(resultadoCategorias.reason),
      });
      avisos.categorias =
        "As categorias não puderam ser carregadas agora. Tente atualizar este bloco.";
    }
    if (resultadoClassificacoes.status === "rejected") {
      console.error("[produtos:alteracao-em-massa:listar-logistica]", {
        operacao: "listar_classificacoes_logisticas",
        ...diagnosticarErroBanco(resultadoClassificacoes.reason),
      });
      avisos.classificacoesLogisticas =
        "As classificações logísticas não puderam ser carregadas agora.";
    }
    if (resultadoModelos.status === "rejected") {
      console.error("[produtos:alteracao-em-massa:listar-retirada]", {
        operacao: "listar_modelos_retirada",
        ...diagnosticarErroBanco(resultadoModelos.reason),
      });
      avisos.modelosRetirada =
        "Os modelos de retirada não puderam ser carregados agora.";
    }

    let marcas: Array<{ id: string; nome: string; ativa: boolean }> = [];
    let avisoMarcas: string | undefined;
    try {
      marcas = await db
        .select({
          id: marcaTable.id,
          nome: marcaTable.nome,
          ativa: marcaTable.ativo,
        })
        .from(marcaTable)
        .orderBy(asc(marcaTable.nome));
    } catch (erro) {
      console.error("[produtos:alteracao-em-massa:listar-marcas]", {
        operacao: "listar_marcas",
        ...diagnosticarErroBanco(erro),
      });
      avisoMarcas =
        "As marcas não puderam ser carregadas agora. Os demais filtros continuam disponíveis.";
      avisos.marcas = avisoMarcas;
    }

    const idsProdutos = produtos.map((produto) => produto.id);
    const [precos, variantes] = idsProdutos.length
      ? await Promise.all([
          db
            .select({
              id: productPricingTable.id,
              produtoId: productPricingTable.productId,
              modalidade: productPricingTable.type,
              precoEmCentavos: productPricingTable.price,
              prazo: productPricingTable.deliveryDays,
              atualizadoEm: productPricingTable.updatedAt,
              versaoConcorrencia:
                sql<string>`${productPricingTable.updatedAt}::text`.as(
                  "preco_versao_concorrencia",
                ),
            })
            .from(productPricingTable)
            .where(inArray(productPricingTable.productId, idsProdutos)),
          db
            .select({
              id: productVariantTable.id,
              produtoId: productVariantTable.productId,
              sku: productVariantTable.sku,
              estoque: productVariantTable.stockQuantity,
              principal: productVariantTable.isDefault,
              atualizadoEm: productVariantTable.updatedAt,
              versaoConcorrencia:
                sql<string>`${productVariantTable.updatedAt}::text`.as(
                  "variante_versao_concorrencia",
                ),
            })
            .from(productVariantTable)
            .where(inArray(productVariantTable.productId, idsProdutos)),
        ])
      : [[], []];

    let vinculosLogisticos: Array<{
      produtoId: string;
      tipoLogisticoId: string;
    }> = [];
    if (idsProdutos.length && !carregamentoAplicacao) {
      try {
        vinculosLogisticos = await db
          .select({
            produtoId: produtosTiposLogisticosTable.produtoId,
            tipoLogisticoId: produtosTiposLogisticosTable.tipoLogisticoId,
          })
          .from(produtosTiposLogisticosTable)
          .where(inArray(produtosTiposLogisticosTable.produtoId, idsProdutos));
      } catch (erro) {
        console.error(
          "[produtos:alteracao-em-massa:listar-vinculos-logistica]",
          {
            operacao: "listar_vinculos_logisticos",
            ...diagnosticarErroBanco(erro),
          },
        );
        avisos.classificacoesLogisticas =
          "Os vínculos logísticos não puderam ser carregados agora.";
      }
    }

    const precosPorProduto = Map.groupBy(precos, (preco) => preco.produtoId);
    const variantesPorProduto = Map.groupBy(
      variantes,
      (variante) => variante.produtoId,
    );
    const classificacoesPorProduto = Map.groupBy(
      vinculosLogisticos,
      (vinculo) => vinculo.produtoId,
    );

    return {
      sucesso: true,
      dados: {
        produtos: produtos.map((produto) => {
          const variantesProduto = variantesPorProduto.get(produto.id) ?? [];
          const varianteTecnica =
            produto.tipoProduto === "simple"
              ? (variantesProduto.find((variante) => variante.principal) ??
                variantesProduto.find(
                  (variante) => variante.sku === produto.sku,
                ) ??
                variantesProduto[0])
              : undefined;

          return {
            ...produto,
            ativo: produto.ativo ?? false,
            permiteRetirada: produto.permiteRetirada ?? false,
            permiteEntregaPropria: produto.permiteEntregaPropria ?? false,
            varianteTecnicaId: varianteTecnica?.id ?? null,
            estoqueVarianteTecnica: varianteTecnica?.estoque ?? null,
            varianteTecnicaAtualizadaEm: varianteTecnica?.atualizadoEm ?? null,
            varianteTecnicaVersaoConcorrencia:
              varianteTecnica?.versaoConcorrencia ?? null,
            precosModalidades: (precosPorProduto.get(produto.id) ?? []).flatMap(
              (preco) => {
                const modalidade = normalizarModalidadePreco(preco.modalidade);
                return modalidade ? [{ ...preco, modalidade }] : [];
              },
            ),
            classificacoesLogisticasIds: (
              classificacoesPorProduto.get(produto.id) ?? []
            ).map((vinculo) => vinculo.tipoLogisticoId),
          };
        }),
        categorias: categorias.map((categoria) => ({
          ...categoria,
          ordem: categoria.ordem ?? 0,
        })),
        marcas,
        classificacoesLogisticas,
        modelosRetirada,
        avisos: Object.keys(avisos).length ? avisos : undefined,
      },
    };
  } catch (erro) {
    console.error("[produtos:alteracao-em-massa:listagem]", {
      operacao: "listar_dados_alteracao_em_massa",
      ...diagnosticarErroBanco(erro),
    });

    return {
      sucesso: false,
      erro: "Não foi possível carregar os produtos para alteração em massa.",
      dados: DADOS_VAZIOS,
    };
  }
}
