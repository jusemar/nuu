// ==========================================
// PRODUCT SERVICE - Conexão com banco de dados
// ==========================================
// Busca dados REAIS do produto via Drizzle ORM.
// Dados que ainda não existem no DB (avaliações, upsell, etc.)
// usam fallback mock temporário.
//
// "server-only" garante que este código NUNCA roda no navegador,
// protegendo credenciais do banco de dados.
import "server-only"

import { db } from "@/db/connection"
import { productTable } from "@/db/schema"
import { eq } from "drizzle-orm"

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
  // findFirst = busca UM registro que combine com o filtro
  // "with" = carrega as relações (JOIN automático do Drizzle)
  const product = await db.query.productTable.findFirst({
    where: eq(productTable.slug, slug),
    with: {
      galleryImages: true,
      pricing: true,
      modeloRetirada: true,
    },
  })

  // Se não encontrou, retorna null (a page.tsx vai tratar como 404)
  return product ?? null
}