// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { categoryTable } from '@/db/table/categories'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    console.log('📝 Atualizando categoria:', { id, data: body })

    const result = await db.update(categoryTable)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(categoryTable.id, id))

    console.log('✅ Categoria atualizada:', result)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}