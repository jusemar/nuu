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
      .select()
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
        .returning()

      console.log(`[API DELETE] Restore completado para:`, result[0]?.name)
      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Categoria restaurada com sucesso'
      })
    }

    // Verificar se tem subcategorias (apenas para soft/hard delete)
    const hasChildren = await db
      .select()
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
        .returning()

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
        .returning()

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
