// src/app/api/admin/categories/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/db'
import { categoryTable } from '@/db/table/categories/categories'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const type = body?.type || 'soft' // 'soft', 'hard', ou 'restore'

    console.log(`[API DELETE] Iniciando operação para categoria ID: ${id}, tipo: ${type}`)

    // Validar se a categoria existe
    const category = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        parentId: categoryTable.parentId,
        isActive: categoryTable.isActive
      })
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!category || category.length === 0) {
      console.log(`[API DELETE] Categoria ID ${id} não encontrada`)
      return NextResponse.json(
        { success: false, message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    console.log(`[API DELETE] Categoria encontrada:`, category[0].name)

    // Para restore, não precisa verificar subcategorias
    if (type === 'restore') {
      // Restore: marca como ativa novamente
      console.log(`[API DELETE] Executando RESTORE (ativar categoria)`)
      const result = await db
        .update(categoryTable)
        .set({ 
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(categoryTable.id, id))
        .returning({
          id: categoryTable.id,
          name: categoryTable.name,
          isActive: categoryTable.isActive
        })

      console.log(`[API DELETE] Restore completado para:`, result[0]?.name)
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Categoria restaurada com sucesso'
      })
    }

    // Verificar se tem subcategorias (apenas para soft/hard delete)
    const hasChildren = await db
      .select({ id: categoryTable.id })
      .from(categoryTable)
      .where(eq(categoryTable.parentId, id))
      .limit(1)

    if (hasChildren && hasChildren.length > 0) {
      console.log(`[API DELETE] Categoria ${id} tem subcategorias, cannot delete`)
      return NextResponse.json(
        { success: false, message: 'Não é possível excluir categoria com subcategorias' },
        { status: 400 }
      )
    }

    console.log(`[API DELETE] Sem subcategorias, prosseguindo com delete ${type}`)

    if (type === 'soft') {
      // Soft delete: marca como inativa
      console.log(`[API DELETE] Executando SOFT DELETE (marcar como inativa)`)
      const result = await db
        .update(categoryTable)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(categoryTable.id, id))
        .returning({
          id: categoryTable.id,
          name: categoryTable.name,
          isActive: categoryTable.isActive
        })

      console.log(`[API DELETE] Soft delete completado para:`, result[0]?.name)
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Categoria marcada como inativa'
      })
    } else if (type === 'hard') {
      // Hard delete: remove permanentemente
      console.log(`[API DELETE] Executando HARD DELETE (deletar permanentemente)`)
      const result = await db
        .delete(categoryTable)
        .where(eq(categoryTable.id, id))
        .returning({
          id: categoryTable.id,
          name: categoryTable.name
        })

      console.log(`[API DELETE] Hard delete completado para:`, result[0]?.name)
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Categoria excluída permanentemente'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Tipo de operação inválido. Use "soft", "hard" ou "restore".' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[API DELETE] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, message: `Erro ao deletar categoria: ${errorMessage}` },
      { status: 500 }
    )
  }
}

/**
 * Handler PATCH para atualizar categoria
 * Atualiza os dados básicos da categoria (nome, slug, descrição, etc)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const {
      name,
      slug,
      description,
      isActive,
      metaTitle,
      metaDescription,
      orderIndex
    } = body || {}

    console.log(`[API PATCH] Iniciando atualização para categoria ID: ${id}`)

    // Validar se a categoria existe
    const existingCategory = await db
      .select({
        id: categoryTable.id,
        name: categoryTable.name
      })
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1)

    if (!existingCategory || existingCategory.length === 0) {
      console.log(`[API PATCH] Categoria ID ${id} não encontrada`)
      return NextResponse.json(
        { success: false, message: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    console.log(`[API PATCH] Categoria encontrada:`, existingCategory[0].name)

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined && name !== null) {
      updateData.name = name
    }
    if (slug !== undefined && slug !== null) {
      updateData.slug = slug
    }
    if (description !== undefined) {
      updateData.description = description
    }
    if (isActive !== undefined && isActive !== null) {
      updateData.isActive = isActive
    }
    if (metaTitle !== undefined) {
      updateData.metaTitle = metaTitle
    }
    if (metaDescription !== undefined) {
      updateData.metaDescription = metaDescription
    }
    if (orderIndex !== undefined && orderIndex !== null) {
      updateData.orderIndex = orderIndex
    }

    console.log(`[API PATCH] Dados para atualizar:`, updateData)

    // Atualizar a categoria
    const result = await db
      .update(categoryTable)
      .set(updateData)
      .where(eq(categoryTable.id, id))
      .returning({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
        isActive: categoryTable.isActive,
        metaTitle: categoryTable.metaTitle,
        metaDescription: categoryTable.metaDescription,
        orderIndex: categoryTable.orderIndex,
        createdAt: categoryTable.createdAt,
        updatedAt: categoryTable.updatedAt
      })

    console.log(`[API PATCH] Categoria atualizada com sucesso:`, result[0]?.name)

    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Categoria atualizada com sucesso'
    })
  } catch (error) {
    console.error('[API PATCH] Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, message: `Erro ao atualizar categoria: ${errorMessage}` },
      { status: 500 }
    )
  }
}
