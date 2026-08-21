// ==========================================
// PRODUCT SERVICE - Conexão com banco de dados
// ==========================================
// Busca dados REAIS do produto via Drizzle ORM.
// Dados que ainda não existem no DB (avaliações, upsell, etc.)
// usam fallback mock temporário.
//
// "server-only" garante que este código NUNCA roda no navegador,
// protegendo credenciais do banco de dados.
import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/lib/variante-tecnica-produto-simples";

// ==========================================
// BUSCAR PRODUTO POR SLUG (dados reais)
// ==========================================

/**
 * Busca um produto pelo slug (URL amigável) diretamente no banco.
 *
 * O que busca junto (relações):
 * - galleryImages: fotos da galeria do produto
 * - pricing: preços por modalidade (estoque, pré-venda, etc.)
 *
 * @param slug - Slug da URL (ex: "aether-run-pro-x")
 * @returns Produto com imagens e preços, ou null se não encontrar
 *
 * EXEMPLO DE USO:
 * const produto = await getProductBySlug("aether-run-pro-x");
 */
export async function getProductBySlug(slug: string) {
  try {
    // findFirst = busca UM registro que combine com o filtro
    // "with" = carrega as relações (JOIN automático do Drizzle)
    const product = await db.query.productTable.findFirst({
      where: and(
        eq(productTable.slug, slug),
        eq(productTable.isActive, true),
        eq(productTable.status, "published"),
      ),
      with: {
        galleryImages: true,
        pricing: true,
        attributes: true,
        variants: {
          with: {
            identificadoresCatalogo: {
              columns: {
                tipo: true,
                valor: true,
                gtinTipo: true,
                marcaId: true,
                status: true,
                principal: true,
              },
            },
          },
        },
        identificadoresCatalogo: {
          columns: {
            tipo: true,
            valor: true,
            gtinTipo: true,
            marcaId: true,
            status: true,
            principal: true,
          },
        },
        modeloRetirada: true,
        marca: true,
      },
    });

    // Apenas a ausência real do registro segue para o notFound() da página.
    if (!product) return null;

    if (product.productKind === "simple") {
      const identificacao = identificarVarianteTecnicaProdutoSimples({
        skuProduto: product.sku,
        variantes: product.variants.map((variante) => ({
          id: variante.id,
          sku: variante.sku,
          atributos: variante.attributes,
          precoEmCentavos: variante.priceInCents,
          estoque: variante.stockQuantity,
          ativa: variante.isActive,
          principal: variante.isDefault,
        })),
      });

      if (identificacao.situacao !== "confiavel") {
        console.error("[pdp:variante-tecnica-inconsistente]", {
          situacao: identificacao.situacao,
        });
      }
    }

    return { ...product, brand: product.marca?.nome ?? null };
  } catch (error) {
    const codigo = crypto.randomUUID();
    const tipo =
      error instanceof Error ? error.constructor.name : "ErroDesconhecido";

    // Não registra slug, SQL, parâmetros nem a mensagem original do driver.
    console.error("Falha ao consultar produto para a PDP", { codigo, tipo });
    throw new Error(`Não foi possível carregar o produto. Código: ${codigo}`);
  }
}

/** Busca legada por SKU mantendo os mesmos filtros públicos da busca por slug. */
export async function getProductBySku(sku: string) {
  try {
    const product = await db.query.productTable.findFirst({
      where: and(
        eq(productTable.sku, sku),
        eq(productTable.isActive, true),
        eq(productTable.status, "published"),
      ),
      with: {
        galleryImages: true,
        pricing: true,
        attributes: true,
        variants: true,
        modeloRetirada: true,
        marca: true,
      },
    });

    return product
      ? { data: { ...product, brand: product.marca?.nome ?? null }, error: null }
      : { data: null, error: "Produto não encontrado" };
  } catch {
    return { data: null, error: "Não foi possível carregar o produto" };
  }
}
