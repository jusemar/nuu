"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db" // Seu arquivo de configuração do Drizzle
import { categoryTable } from "@/db/table/categories"

export async function createCategory(formData: {
  name: string
  slug: string
  description?: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
}) {
  try {
   
    // Validação básica
    if (!formData.name || !formData.slug) {
      return { 
        success: false, 
        message: "Nome e slug são obrigatórios" 
      }
    }

    // Inserir no banco
    const [newCategory] = await db
      .insert(categoryTable)
      .values({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        isActive: formData.isActive,
      })
      .returning()   

    // Revalida o cache
    revalidatePath("/admin/categories")

    return { 
      success: true, 
      message: "Categoria criada com sucesso!",
      data: newCategory
    }
    
  } catch (error: any) {
    console.error("Erro ao criar categoria:", error)
    
    // Erro de slug duplicado
    if (error.code === '23505') {
      return { 
        success: false, 
        message: "Já existe uma categoria com este slug" 
      }
    }
    
    return { 
      success: false, 
      message: "Erro interno ao criar categoria" 
    }
  }
}