import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const formatosImagemBannerHomePermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const tamanhoMaximoImagemBytes = 5 * 1024 * 1024;

function normalizarNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const destino = formData.get("destino");
    const pasta = destino === "banners-home" ? "banners-home" : "products";

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Envie um arquivo de imagem válido." },
        { status: 400 },
      );
    }

    if (
      pasta === "banners-home" &&
      !formatosImagemBannerHomePermitidos.includes(file.type)
    ) {
      return NextResponse.json(
        { error: "Formatos aceitos: JPG, PNG e WEBP." },
        { status: 400 },
      );
    }

    if (pasta === "banners-home" && file.size > tamanhoMaximoImagemBytes) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 5MB." },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const nomeSeguro = normalizarNomeArquivo(file.name);
    const uniqueFileName = `${pasta}/${timestamp}-${randomSuffix}-${nomeSeguro}`;

    const blob = await put(uniqueFileName, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
