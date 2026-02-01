// src/app/api/admin/categories/route.ts
import { NextResponse } from 'next/server';
import { getCategories } from '@/data/categories/get';
import { db } from '@/db';
import { categoryTable } from '@/db/table/categories/categories';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro na API de categorias (GET):', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      description,
      isActive = true,
      metaTitle,
      metaDescription,
      orderIndex = 0,
      subcategories
    } = body || {};

    // Validação mínima
    if (!name || !slug) {
      return NextResponse.json({ success: false, message: 'Nome e slug são obrigatórios' }, { status: 400 });
    }

    // Cria categoria principal (nível 0)
    const [category] = await db
      .insert(categoryTable)
      .values({
        name,
        slug,
        description: description || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        isActive,
        parentId: null,
        level: 0,
        orderIndex,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!category) {
      throw new Error('Falha ao criar categoria principal');
    }

    // Função recursiva para criar subcategorias (usa a mesma tabela categoryTable)
    const createSubcategoriesRecursively = async (subs: any[], parentId: string | null) => {
      for (const sub of subs) {
        const [createdSub] = await db
          .insert(categoryTable)
          .values({
            name: sub.name,
            slug: sub.slug,
            description: sub.description ?? null,
            parentId: parentId ?? null,
            level: sub.level ?? 1,
            orderIndex: sub.orderIndex ?? 0,
            imageUrl: null,
            metaTitle: sub.metaTitle ?? null,
            metaDescription: sub.metaDescription ?? null,
            isActive: sub.isActive !== undefined ? sub.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        if (!createdSub) {
          throw new Error(`Falha ao criar subcategoria: ${sub.name}`);
        }

        if (sub.children && sub.children.length > 0) {
          await createSubcategoriesRecursively(sub.children, createdSub.id);
        }
      }
    };

    if (subcategories && Array.isArray(subcategories) && subcategories.length > 0) {
      await createSubcategoriesRecursively(subcategories, category.id);
    }

    // Revalida cache
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${category.id}`);

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Erro na API de categorias (POST):', error);
    return NextResponse.json({ success: false, message: 'Erro interno ao criar categoria' }, { status: 500 });
  }
} 