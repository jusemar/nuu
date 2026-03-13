// src/features/store/products/service/getProducts.ts
// ==============================================================
// SERVICE: Buscar produtos para a loja (frontend público).
// Estas funções são usadas nas páginas da loja para listar produtos.
// Inclui imagens da galeria principal e modalidades de preço.
// ==============================================================
import "server-only"

import { db } from "@/db"
import { productTable } from "@/db/schema"
import { desc } from "drizzle-orm"

/**
 * Busca todos os produtos da loja.
 * Inclui imagens da galeria (product_gallery_images) e preços (product_pricing).
 *
 * @returns Array com todos os produtos, suas imagens e preços
 */
export const getProducts = async () => {
  const products = await db.query.productTable.findMany({
    with: {
      galleryImages: true,  // Imagens da galeria principal
      pricing: true,        // Modalidades de preço
    },
  })
  return products
}

/**
 * Busca os produtos mais recentes (ordenados por data de criação).
 * Usado na seção "Novidades" da página inicial.
 *
 * @returns Array com os produtos mais recentes primeiro
 */
export const getNewProducts = async () => {
  const products = await db.query.productTable.findMany({
    orderBy: [desc(productTable.createdAt)],
    with: {
      galleryImages: true,  // Imagens da galeria principal
      pricing: true,        // Modalidades de preço
    },
  })
  return products
}
