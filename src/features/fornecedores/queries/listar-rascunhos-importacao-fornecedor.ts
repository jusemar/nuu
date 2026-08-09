import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  productPricingTable,
  productTable,
  productVariantTable,
  produtoRascunhosTable,
} from "@/db/schema";
import {
  extrairConfiguracaoComercialRascunhoFornecedor,
  extrairSecoesLojaRascunhoFornecedor,
  listarPendenciasAtualizacaoRascunhoFornecedor,
  listarPendenciasRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/lib/variante-tecnica-produto-simples";

export type RascunhoImportacaoFornecedor = {
  id: string;
  fornecedorId: string | null;
  stagingId: string | null;
  codigoFornecedor: string | null;
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  categoriaNome: string | null;
  marcaId: string | null;
  marcaNome: string | null;
  ean: string | null;
  ncm: string | null;
  precoFornecedor: string | null;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  peso: string | null;
  altura: string | null;
  largura: string | null;
  comprimento: string | null;
  imagens: string[];
  secoesLoja: string[];
  configuracaoComercial: ReturnType<
    typeof extrairConfiguracaoComercialRascunhoFornecedor
  >;
  pendencias: string[];
  status: "rascunho" | "pendente_conciliacao" | "pronto_para_publicar";
  /** Presente só quando este item é "atualizar produto existente". */
  produtoAtualizadoId: string | null;
  produtoAtualizadoNome: string | null;
  produtoAtualizadoSku: string | null;
  precoAtualLoja: string | null;
  estoqueAtualLoja: number | null;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairStagingId(dadosOrigemJson: unknown) {
  if (!ehRegistro(dadosOrigemJson)) return null;

  const origem = dadosOrigemJson.origemFluxoFornecedor;
  if (!ehRegistro(origem) || typeof origem.stagingId !== "string") return null;

  return origem.stagingId;
}

export async function listarRascunhosImportacaoFornecedor(
  importacaoId: string,
): Promise<RascunhoImportacaoFornecedor[]> {
  // As duas consultas são dependentes (a segunda usa os fornecedores da primeira), então
  // ficam juntas na mesma leitura protegida: uma retentativa refaz o par inteiro e a lista
  // de "já publicados" nunca é aplicada sobre rascunhos de outra tentativa.
  const { linhas, variantesProdutosAtualizados, vinculosAtivos } =
    await executarLeituraFornecedores(
      {
        etapa: "conciliacao:listar-rascunhos",
        importacaoId,
        mensagemAmigavel:
          "Não foi possível carregar os itens da conciliação agora. Tente novamente em alguns segundos.",
      },
      async () => {
        const linhasRascunho = await db
          .select({
            id: produtoRascunhosTable.id,
            fornecedorId: produtoRascunhosTable.fornecedorId,
            codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
            nome: produtoRascunhosTable.nome,
            descricao: produtoRascunhosTable.descricao,
            categoriaId: produtoRascunhosTable.categoriaId,
            categoriaNome: categoryTable.name,
            marcaId: produtoRascunhosTable.marcaId,
            marcaNome: marcaTable.nome,
            ean: produtoRascunhosTable.ean,
            ncm: produtoRascunhosTable.ncm,
            precoFornecedor: produtoRascunhosTable.precoFornecedor,
            precoLoja: produtoRascunhosTable.precoLoja,
            estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
            peso: produtoRascunhosTable.peso,
            altura: produtoRascunhosTable.altura,
            largura: produtoRascunhosTable.largura,
            comprimento: produtoRascunhosTable.comprimento,
            imagens: produtoRascunhosTable.imagens,
            dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
            status: produtoRascunhosTable.status,
            produtoAtualizadoId: produtoRascunhosTable.produtoAtualizadoId,
            produtoAtualizadoNome: productTable.name,
            produtoAtualizadoSku: productTable.sku,
            precoAtualLojaEmCentavos: productPricingTable.price,
          })
          .from(produtoRascunhosTable)
          .leftJoin(
            categoryTable,
            eq(produtoRascunhosTable.categoriaId, categoryTable.id),
          )
          .leftJoin(
            marcaTable,
            eq(produtoRascunhosTable.marcaId, marcaTable.id),
          )
          // Os dois joins abaixo trazem o retrato ATUAL do produto real da loja,
          // usado pela Conciliação para mostrar "o que está" × "o que chegou".
          // São `leftJoin` de propósito: item "criar produto novo" não tem
          // `produtoAtualizadoId` e simplesmente vem com esses campos nulos.
          //
          // O estoque atual NÃO entra por join: produto tem N variantes, e um
          // join um-para-muitos repetiria o mesmo rascunho uma vez por variante,
          // duplicando o item na tela da Conciliação. Ele é resolvido logo
          // abaixo, em consulta separada, pela mesma regra estrita de variante
          // técnica usada no resto do sistema.
          .leftJoin(
            productTable,
            eq(productTable.id, produtoRascunhosTable.produtoAtualizadoId),
          )
          .leftJoin(
            productPricingTable,
            and(
              eq(productPricingTable.productId, productTable.id),
              eq(productPricingTable.isActive, true),
              eq(productPricingTable.mainCardPrice, true),
            ),
          )
          .where(
            and(
              eq(produtoRascunhosTable.origemTipo, "fornecedor_excel"),
              eq(produtoRascunhosTable.origemProvedor, "arquivo_excel"),
              inArray(produtoRascunhosTable.status, [
                "rascunho",
                "pendente_conciliacao",
                "pronto_para_publicar",
              ]),
              sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
            ),
          );

        const fornecedoresIds = Array.from(
          new Set(
            linhasRascunho
              .map((linha) => linha.fornecedorId)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        // Produtos reais referenciados pelos itens "atualizar" deste lote.
        const produtosAtualizadosIds = Array.from(
          new Set(
            linhasRascunho
              .map((linha) => linha.produtoAtualizadoId)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        return {
          linhas: linhasRascunho,
          variantesProdutosAtualizados:
            produtosAtualizadosIds.length > 0
              ? await db
                  .select({
                    id: productVariantTable.id,
                    produtoId: productVariantTable.productId,
                    sku: productVariantTable.sku,
                    atributos: productVariantTable.attributes,
                    precoEmCentavos: productVariantTable.priceInCents,
                    estoque: productVariantTable.stockQuantity,
                    ativa: productVariantTable.isActive,
                    principal: productVariantTable.isDefault,
                  })
                  .from(productVariantTable)
                  .where(
                    inArray(
                      productVariantTable.productId,
                      produtosAtualizadosIds,
                    ),
                  )
              : [],
          vinculosAtivos:
            fornecedoresIds.length > 0
              ? await db
                  .select({
                    fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
                    codigoFornecedor:
                      fornecedorProdutoVinculosTable.codigoFornecedor,
                  })
                  .from(fornecedorProdutoVinculosTable)
                  .where(
                    and(
                      inArray(
                        fornecedorProdutoVinculosTable.fornecedorId,
                        fornecedoresIds,
                      ),
                      eq(fornecedorProdutoVinculosTable.status, "ativo"),
                    ),
                  )
              : [],
        };
      },
    );

  const chavesPublicadas = new Set(
    vinculosAtivos.map(
      (vinculo) =>
        `${vinculo.fornecedorId}:${vinculo.codigoFornecedor?.trim() ?? ""}`,
    ),
  );

  // Agrupa as variantes por produto para resolver o estoque atual sem repetir
  // linhas de rascunho.
  const variantesPorProduto = new Map<
    string,
    Array<(typeof variantesProdutosAtualizados)[number]>
  >();
  for (const variante of variantesProdutosAtualizados) {
    const lista = variantesPorProduto.get(variante.produtoId) ?? [];
    lista.push(variante);
    variantesPorProduto.set(variante.produtoId, lista);
  }

  /**
   * Estoque que a Conciliação mostra como "atual na loja".
   *
   * Usa a mesma regra estrita do resto do sistema: só há um número confiável
   * quando o produto simples tem exatamente uma variante técnica coerente.
   * Produto com variantes reais (ou com estrutura interna ambígua) devolve
   * `null` — a tela mostra "—" em vez de um número escolhido ao acaso, que o
   * gestor leria como verdade ao aprovar a atualização.
   */
  function resolverEstoqueAtualLoja(
    produtoId: string | null,
    skuProduto: string | null,
  ) {
    if (!produtoId || !skuProduto) return null;

    const identificacao = identificarVarianteTecnicaProdutoSimples({
      skuProduto,
      variantes: variantesPorProduto.get(produtoId) ?? [],
    });

    return identificacao.situacao === "confiavel"
      ? identificacao.variante.estoque
      : null;
  }

  return linhas
    .filter((linha) => {
      // O sinal implícito "vínculo ativo = já publicado" só vale para itens
      // "criar produto novo". Itens "atualizar" já nascem com vínculo ativo
      // desde a Vinculação — isso não significa que este lote já foi
      // publicado, então não devem ser excluídos por esse motivo.
      if (linha.produtoAtualizadoId) return true;

      return (
        !linha.fornecedorId ||
        !chavesPublicadas.has(
          `${linha.fornecedorId}:${linha.codigoFornecedor?.trim() ?? ""}`,
        )
      );
    })
    .map(({ dadosOrigemJson, precoAtualLojaEmCentavos, ...linha }) => {
      const secoesLoja = extrairSecoesLojaRascunhoFornecedor(dadosOrigemJson);
      const configuracaoComercial =
        extrairConfiguracaoComercialRascunhoFornecedor(dadosOrigemJson);
      // Item "atualizar" não precisa de categoria/marca/seção: o produto real
      // já tem tudo isso. A única pendência possível é faltar preço a aplicar.
      const pendencias = linha.produtoAtualizadoId
        ? listarPendenciasAtualizacaoRascunhoFornecedor(linha.precoLoja)
        : listarPendenciasRascunhoFornecedor({
            nome: linha.nome,
            categoriaId: linha.categoriaId,
            marcaId: linha.marcaId,
            precoLoja: linha.precoLoja,
            dadosOrigemJson,
          });

      return {
        ...linha,
        status: linha.status as RascunhoImportacaoFornecedor["status"],
        stagingId: extrairStagingId(dadosOrigemJson),
        imagens: linha.imagens ?? [],
        secoesLoja,
        configuracaoComercial,
        pendencias,
        precoAtualLoja:
          precoAtualLojaEmCentavos === null
            ? null
            : (precoAtualLojaEmCentavos / 100).toFixed(2),
        estoqueAtualLoja: resolverEstoqueAtualLoja(
          linha.produtoAtualizadoId,
          linha.produtoAtualizadoSku,
        ),
      };
    });
}
