// src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import { getCategories } from '@/data/categories/get';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro na API de categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}