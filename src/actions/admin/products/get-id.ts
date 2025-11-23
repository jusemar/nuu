"use server"

import { db } from "@/db"
import { productTable, productPricingTable } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getProduct(id: string) {
  try {
    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, id))
      .limit(1)

    if (!product) {
      return {
        success: false,
        message: "Produto não encontrado",
        data: null
      }
    }

    // ✅ BUSCAR MODALIDADES DE PREÇO
    const pricingModalities = await db
      .select()
      .from(productPricingTable)
      .where(eq(productPricingTable.productId, id))

    // ✅ FORMATAR MODALIDADES PARA O FRONTEND
    const modalities: any = {}
    let mainCardPriceType = ''

    pricingModalities.forEach(modality => {
      modalities[modality.type] = {
        price: (modality.price / 100).toFixed(2), // Converter de centavos
        deliveryText: modality.deliveryDays || '',
        promo: {
          active: modality.hasPromo || false,
          type: modality.promoType || 'normal',
          price: modality.promoPrice ? (modality.promoPrice / 100).toFixed(2) : '',
          endDate: undefined // Ajustar conforme seu schema
        }
      }

      // ✅ IDENTIFICAR QUAL É A MODALIDADE PRINCIPAL DO CARD
      if (modality.mainCardPrice) {
        mainCardPriceType = modality.type
      }
    })

    return {
      success: true,
      message: "Produto encontrado com sucesso",
      data: {
        ...product,
        pricing: {
          modalities,
          mainCardPriceType
        }
      }
    }

  } catch (error: any) {
    console.error("Erro ao buscar produto:", error)
    return {
      success: false,
      message: "Erro interno ao buscar produto", 
      data: null
    }
  }
}