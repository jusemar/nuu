import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      );
    }
const timestamp = Date.now();
const randomSuffix = Math.random().toString(36).substring(2, 8);
const uniqueFileName = `products/${timestamp}-${randomSuffix}-${file.name}`;

const blob = await put(uniqueFileName, file, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN,
  addRandomSuffix: false, // Já estamos gerando nome único
});


    return NextResponse.json(blob);

  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}