// src/features/admin/products/service/getProductById.ts
// ==============================================================
// SERVICE: Buscar um produto pelo ID para a página de edição.
// Este arquivo é chamado pelo hook useProductId quando a página
// de edição do produto é aberta.
// ==============================================================
"use server"

// --- IMPORTAÇÕES DO BANCO DE DADOS ---
import { db } from "@/db"
import {
  productTable,            // Tabela principal dos produtos
  productGalleryImagesTable, // Tabela de imagens da GALERIA PRINCIPAL (product_gallery_images)
  productPricingTable,      // Tabela de modalidades de preço
  categoryTable,            // Tabela de categorias (para buscar o nome da categoria)
} from "@/db/schema"
import { eq, asc } from "drizzle-orm"

/**
 * Busca um produto completo pelo seu ID.
 *
 * Retorna todos os dados necessários para preencher o formulário
 * de edição: dados básicos, imagens da galeria principal, preços, etc.
 *
 * @param id - O UUID do produto a ser buscado
 * @returns Objeto com { success, message, data } onde data contém o produto completo
 */
export async function getProductById(id: string) {
  try {
    // ---------------------------------------------------------------
    // 1. BUSCAR O PRODUTO PRINCIPAL
    // Faz um SELECT na tabela de produtos com LEFT JOIN na categoria
    // para trazer também o nome da categoria associada.
    // ---------------------------------------------------------------
    const [product] = await db
      .select({
        // Campos básicos do produto
        id: productTable.id,
        name: productTable.name,
        slug: productTable.slug,
        description: productTable.description,
        cardShortText: productTable.cardShortText,
        brand: productTable.brand,
        sku: productTable.sku,
        isActive: productTable.isActive,
        collection: productTable.collection,
        tags: productTable.tags,

        // Códigos do produto
        productType: productTable.productType,
        productCode: productTable.productCode,
        ncmCode: productTable.ncmCode,

        // Flags de exibição na loja (ex: "Novidade", "Mais Vendido")
        storeProductFlags: productTable.storeProductFlags,

        // Status do produto (draft, published, etc.)
        status: productTable.status,

        // Preços diretos no produto
        costPrice: productTable.costPrice,
        salePrice: productTable.salePrice,
        promoPrice: productTable.promoPrice,
        taxRate: productTable.taxRate,

        // Dimensões e frete
        weight: productTable.weight,
        length: productTable.length,
        width: productTable.width,
        height: productTable.height,
        hasFreeShipping: productTable.hasFreeShipping,
        hasLocalPickup: productTable.hasLocalPickup,

        // Garantia
        warrantyPeriod: productTable.warrantyPeriod,
        warrantyProvider: productTable.warrantyProvider,

        // Vendedor
        sellerCode: productTable.sellerCode,
        internalCode: productTable.internalCode,
        sellerInfo: productTable.sellerInfo,

        // SEO
        metaTitle: productTable.metaTitle,
        metaDescription: productTable.metaDescription,
        canonicalUrl: productTable.canonicalUrl,

        // Categoria (campo vindo do JOIN com categoryTable)
        categoryId: productTable.categoryId,
        categoryName: categoryTable.name,

        // Datas de controle
        createdAt: productTable.createdAt,
        updatedAt: productTable.updatedAt,
      })
      .from(productTable)
      // LEFT JOIN: traz o nome da categoria mesmo se o produto não tiver categoria
      .leftJoin(categoryTable, eq(categoryTable.id, productTable.categoryId))
      // Filtra pelo ID do produto
      .where(eq(productTable.id, id))
      // Limita a 1 resultado (pois o ID é único)
      .limit(1)

    // Se não encontrou o produto, retorna erro
    if (!product) {
      return { success: false, message: "Produto não encontrado", data: null }
    }

    // ---------------------------------------------------------------
    // 2. BUSCAR IMAGENS DA GALERIA PRINCIPAL
    // Busca na tabela "product_gallery_images" usando o productId.
    // IMPORTANTE: NÃO busca da tabela "product_image" (que é de variantes).
    // Ordena pelo campo sortOrder para manter a ordem definida pelo usuário.
    // ---------------------------------------------------------------
    const galleryImages = await db
      .select({
        id: productGalleryImagesTable.id,
        imageUrl: productGalleryImagesTable.imageUrl,
        isPrimary: productGalleryImagesTable.isPrimary,
        sortOrder: productGalleryImagesTable.sortOrder,
        altText: productGalleryImagesTable.altText,
      })
      .from(productGalleryImagesTable)
      .where(eq(productGalleryImagesTable.productId, id))
      .orderBy(asc(productGalleryImagesTable.sortOrder))

    // ---------------------------------------------------------------
    // 3. BUSCAR MODALIDADES DE PREÇO
    // Cada produto pode ter diferentes modalidades de preço:
    // estoque, pré-venda, dropshipping, sob encomenda, etc.
    // ---------------------------------------------------------------
    const pricingModalities = await db
      .select()
      .from(productPricingTable)
      .where(eq(productPricingTable.productId, id))

    // Montar o objeto de modalidades no formato que o frontend espera
    const modalities: Record<string, any> = {}
    let mainCardPriceType = ""

    pricingModalities.forEach((m: any) => {
      // Tipo da modalidade (stock, preSale, dropshipping, orderBasis)
      const type = m.type || "default"

      // Converter preço de centavos para reais (o banco salva em centavos)
      const price = m.price ? Number(m.price) / 100 : 0
      const deliveryText = m.deliveryDays || ""

      // Dados de promoção
      const promoActive = Boolean(m.hasPromo)
      const promoPrice = m.promoPrice ? Number(m.promoPrice) / 100 : undefined
      const promoType = m.promoType || "normal"
      const promoEndDate = m.promoEndDate || undefined

      // Montar o objeto da modalidade
      modalities[type] = {
        price: price.toFixed(2),
        deliveryText,
        promo: {
          active: promoActive,
          type: promoType,
          price: promoPrice ? promoPrice.toFixed(2) : "",
          endDate: promoEndDate,
        },
      }

      // Identifica qual modalidade é exibida como preço principal no card
      if (m.mainCardPrice) mainCardPriceType = type
    })

    // ---------------------------------------------------------------
    // 4. PROCESSAR STORE PRODUCT FLAGS
    // As flags podem vir como string JSON ou array. Aqui garantimos
    // que sempre será um array de strings.
    // ---------------------------------------------------------------
    let flags: string[] = []
    if (product.storeProductFlags) {
      try {
        flags =
          typeof product.storeProductFlags === "string"
            ? JSON.parse(product.storeProductFlags)
            : (product.storeProductFlags as any)
      } catch {
        flags = Array.isArray(product.storeProductFlags)
          ? product.storeProductFlags
          : []
      }
    }

    // ---------------------------------------------------------------
    // 5. PROCESSAR TAGS
    // Mesma lógica das flags: garantir que seja um array de strings.
    // ---------------------------------------------------------------
    let tags: string[] = []
    if (product.tags) {
      try {
        tags =
          typeof product.tags === "string"
            ? JSON.parse(product.tags)
            : product.tags
      } catch {
        tags = Array.isArray(product.tags) ? product.tags : []
      }
    }

    // ---------------------------------------------------------------
    // 6. NORMALIZAR IMAGENS PARA O FORMATO DO FRONTEND
    // O componente ProductImageGallery espera objetos com:
    //   - id: identificador único
    //   - url: URL da imagem no Vercel Blob
    //   - isPrimary: se é a imagem principal
    // NÃO inclui variantId pois são imagens da galeria principal.
    // ---------------------------------------------------------------
    const normalizedImages = galleryImages.map((img) => ({
      id: img.id,
      url: img.imageUrl,        // URL do Vercel Blob
      preview: img.imageUrl,    // Usa a mesma URL como preview
      isPrimary: img.isPrimary || false,
      altText: img.altText || "",
    }))

    // ---------------------------------------------------------------
    // 7. RETORNAR TODOS OS DADOS DO PRODUTO
    // Monta o objeto final com todos os dados necessários para
    // preencher o formulário de edição.
    // ---------------------------------------------------------------
    return {
      success: true,
      message: "Produto encontrado com sucesso",
      data: {
        ...product,
        tags,
        storeProductFlags: flags,
        images: normalizedImages,
        pricing: { modalities, mainCardPriceType },
      },
    }
  } catch (error: any) {
    // Em caso de erro, loga no console e retorna mensagem de erro
    console.error("Erro ao buscar produto:", error)
    return {
      success: false,
      message: "Erro interno ao buscar produto",
      data: null,
    }
  }
}
