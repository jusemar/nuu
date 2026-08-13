import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable, produtosVendaCruzadaTable } from "@/db/schema";
import { adaptarPrecosVitrine } from "@/features/precificacao/server";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/lib/variante-tecnica-produto-simples";

export type ProdutoVendaCruzadaPdp = {
  id: string;
  nome: string;
  slug: string;
  imagemUrl: string | null;
  precoEmCentavos: number;
  precoOriginalEmCentavos: number | null;
  percentualOff: number | null;
  produtoVariavel: boolean;
  itemCarrinho: {
    produtoVarianteId: string;
    sku: string;
    modalidadeTipo: string;
    estoqueDisponivel: number | null;
  } | null;
};

function produtoEstaDisponivel(
  produto: {
    productKind: string;
    sku: string;
    variants: Array<{
      id: string;
      sku: string;
      attributes: Record<string, string>;
      priceInCents: number;
      stockQuantity: number;
      isActive: boolean;
      isDefault: boolean;
    }>;
  },
  modalidade: string,
) {
  if (produto.productKind === "variable") {
    return produto.variants.some(
      (variante) =>
        variante.isActive &&
        variante.stockQuantity > 0 &&
        variante.priceInCents > 0,
    );
  }

  const varianteTecnica = identificarVarianteTecnicaProdutoSimples({
    skuProduto: produto.sku,
    variantes: produto.variants.map((variante) => ({
      id: variante.id,
      sku: variante.sku,
      atributos: variante.attributes,
      precoEmCentavos: variante.priceInCents,
      estoque: variante.stockQuantity,
      ativa: variante.isActive,
      principal: variante.isDefault,
    })),
  });

  if (varianteTecnica.situacao !== "confiavel") return false;
  return modalidade !== "stock" || varianteTecnica.variante.estoque > 0;
}

/** Carrega vínculos e produtos em uma consulta; a precificação é feita em lote. */
export async function buscarVendaCruzadaPdp(
  produtoPrincipalId: string,
): Promise<ProdutoVendaCruzadaPdp[]> {
  try {
    const produtoPrincipal = await db.query.productTable.findFirst({
      where: eq(productTable.id, produtoPrincipalId),
      columns: { id: true, vendaCruzadaAtiva: true },
      with: {
        vendasCruzadasConfiguradas: {
          orderBy: asc(produtosVendaCruzadaTable.ordem),
          with: {
            produtoOferecido: {
              with: { galleryImages: true, pricing: true, variants: true },
            },
          },
        },
      },
    });

    if (!produtoPrincipal?.vendaCruzadaAtiva) return [];

    const idsEncontrados = new Set<string>();
    const produtos = produtoPrincipal.vendasCruzadasConfiguradas
      .map((vinculo) => vinculo.produtoOferecido)
      .filter((produto) => {
        if (
          produto.id === produtoPrincipalId ||
          !produto.isActive ||
          produto.status !== "published" ||
          idsEncontrados.has(produto.id)
        ) {
          return false;
        }
        idsEncontrados.add(produto.id);
        return true;
      })
      .slice(0, 4);

    if (produtos.length === 0) return [];
    const precos = await adaptarPrecosVitrine(produtos);

    return produtos.flatMap((produto) => {
      const preco = precos.produtosPorId[produto.id]?.precoPrincipal;
      if (
        !preco ||
        preco.precoFinalEmCentavos <= 0 ||
        !produtoEstaDisponivel(produto, preco.modalidade)
      ) {
        return [];
      }

      const imagem =
        produto.galleryImages.find((item) => item.isPrimary) ??
        produto.galleryImages[0] ??
        produto.variants.find((variante) => variante.imageUrl)?.imageUrl;

      return [
        {
          id: produto.id,
          nome: produto.name,
          slug: produto.slug,
          imagemUrl:
            typeof imagem === "string" ? imagem : (imagem?.imageUrl ?? null),
          precoEmCentavos: preco.precoFinalEmCentavos,
          precoOriginalEmCentavos: preco.possuiPromocao
            ? preco.precoOriginalEmCentavos
            : null,
          percentualOff: preco.possuiPromocao ? preco.percentualOff : null,
          produtoVariavel: produto.productKind === "variable",
          itemCarrinho:
            produto.productKind !== "variable"
              ? (() => {
                  const variante = identificarVarianteTecnicaProdutoSimples({
                    skuProduto: produto.sku,
                    variantes: produto.variants.map((item) => ({
                      id: item.id,
                      sku: item.sku,
                      atributos: item.attributes,
                      precoEmCentavos: item.priceInCents,
                      estoque: item.stockQuantity,
                      ativa: item.isActive,
                      principal: item.isDefault,
                    })),
                  });
                  return variante.situacao === "confiavel"
                    ? {
                        produtoVarianteId: variante.variante.id,
                        sku: variante.variante.sku,
                        modalidadeTipo: preco.modalidade,
                        estoqueDisponivel: variante.variante.estoque,
                      }
                    : null;
                })()
              : null,
        },
      ];
    });
  } catch (erro) {
    const codigo = crypto.randomUUID();
    console.error("Falha ao consultar venda cruzada para a PDP", {
      codigo,
      tipo: erro instanceof Error ? erro.constructor.name : "ErroDesconhecido",
    });
    return [];
  }
}
