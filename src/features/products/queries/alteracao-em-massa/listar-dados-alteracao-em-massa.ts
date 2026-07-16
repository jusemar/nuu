import "server-only";

import { asc, eq, inArray } from "drizzle-orm";

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

/**
 * Carrega somente os dados necessários para a primeira fase da tela.
 * Não executa escrita e não reutiliza actions de atualização de produtos.
 */
export async function listarDadosAlteracaoEmMassa(
  produtosIds?: string[],
): Promise<ResultadoAlteracaoEmMassa> {
  try {
    const [
      produtos,
      categorias,
      marcas,
      classificacoesLogisticas,
      modelosRetirada,
    ] = await Promise.all([
      db
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
          secoesLoja: productTable.storeProductFlags,
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
        })
        .from(productTable)
        .innerJoin(categoryTable, eq(productTable.categoryId, categoryTable.id))
        .innerJoin(marcaTable, eq(productTable.marcaId, marcaTable.id))
        .where(
          produtosIds?.length
            ? inArray(productTable.id, produtosIds)
            : undefined,
        )
        .orderBy(asc(productTable.name)),
      db
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
        ),
      db
        .select({
          id: marcaTable.id,
          nome: marcaTable.nome,
          ativa: marcaTable.ativo,
        })
        .from(marcaTable)
        .orderBy(asc(marcaTable.nome)),
      db
        .select({
          id: tiposLogisticosTable.id,
          nome: tiposLogisticosTable.nome,
          descricao: tiposLogisticosTable.descricao,
        })
        .from(tiposLogisticosTable)
        .where(eq(tiposLogisticosTable.ativo, true))
        .orderBy(asc(tiposLogisticosTable.nome)),
      db
        .select({
          id: modelosRetiradaTable.id,
          nome: modelosRetiradaTable.nome,
          prazoTexto: modelosRetiradaTable.prazoTexto,
          mensagem: modelosRetiradaTable.mensagem,
        })
        .from(modelosRetiradaTable)
        .where(eq(modelosRetiradaTable.ativo, true))
        .orderBy(asc(modelosRetiradaTable.nome)),
    ]);

    const idsProdutos = produtos.map((produto) => produto.id);
    const [precos, variantes, vinculosLogisticos] = idsProdutos.length
      ? await Promise.all([
          db
            .select({
              id: productPricingTable.id,
              produtoId: productPricingTable.productId,
              modalidade: productPricingTable.type,
              precoEmCentavos: productPricingTable.price,
              prazo: productPricingTable.deliveryDays,
              atualizadoEm: productPricingTable.updatedAt,
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
            })
            .from(productVariantTable)
            .where(inArray(productVariantTable.productId, idsProdutos)),
          db
            .select({
              produtoId: produtosTiposLogisticosTable.produtoId,
              tipoLogisticoId: produtosTiposLogisticosTable.tipoLogisticoId,
            })
            .from(produtosTiposLogisticosTable)
            .where(
              inArray(produtosTiposLogisticosTable.produtoId, idsProdutos),
            ),
        ])
      : [[], [], []];

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
            secoesLoja: produto.secoesLoja ?? [],
            permiteRetirada: produto.permiteRetirada ?? false,
            permiteEntregaPropria: produto.permiteEntregaPropria ?? false,
            varianteTecnicaId: varianteTecnica?.id ?? null,
            estoqueVarianteTecnica: varianteTecnica?.estoque ?? null,
            varianteTecnicaAtualizadaEm: varianteTecnica?.atualizadoEm ?? null,
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
      },
    };
  } catch (erro) {
    console.error("[produtos:alteracao-em-massa:listagem]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível carregar os produtos para alteração em massa.",
      dados: DADOS_VAZIOS,
    };
  }
}
