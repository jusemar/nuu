"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { categoryTable } from "@/db/table/categories/categories"
import { eq } from "drizzle-orm"

export async function createCategory(formData: {
  name: string
  slug: string
  description?: string
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
  // NOVOS CAMPOS:
  parentId?: string | null  // UUID da categoria pai (ou null para raiz)
  imageUrl?: string
  orderIndex?: number
}) {
  try {
    // Validação básica
    if (!formData.name || !formData.slug) {
      return { 
        success: false, 
        message: "Nome e slug são obrigatórios" 
      }
    }

    // VALIDAÇÃO: Verificar se parentId existe (se fornecido)
    let level = 0 // Nível padrão (categoria raiz)
    
    if (formData.parentId) {
      const [parentCategory] = await db
        .select()
        .from(categoryTable)
        .where(eq(categoryTable.id, formData.parentId))
        .limit(1)

      if (!parentCategory) {
        return {
          success: false,
          message: "Categoria pai não encontrada"
        }
      }
      
      // Nível = nível do pai + 1
      level = parentCategory.level + 1
    }

    // VALIDAÇÃO: Não criar hierarquia muito profunda (opcional)
    if (level > 2) {
      return {
        success: false,
        message: "Máximo de 3 níveis de hierarquia permitidos"
      }
    }

    // Inserir no banco com NOVOS campos
    const [newCategory] = await db
      .insert(categoryTable)
      .values({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        isActive: formData.isActive,
        // NOVOS:
        parentId: formData.parentId || null,
        level: level,
        orderIndex: formData.orderIndex || 0,
        imageUrl: formData.imageUrl || null,
      })
      .returning()   

    // Revalida o cache
    revalidatePath("/admin/categories")
    revalidatePath("/categories") // Páginas públicas também

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