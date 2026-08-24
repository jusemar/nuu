import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { traduzirErroAutorizacaoRouteHandler } from "@/features/autenticacao/lib/autorizacao-admin/traduzir-erro-autorizacao-route-handler";

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
    const contexto = new URL(request.url).searchParams.get("contexto");
    const configuracao =
      contexto === "produto"
        ? {
            pasta: "products",
            permissao: PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR,
          }
        : contexto === "banner"
          ? {
              pasta: "banners-home",
              permissao: PERMISSOES_ADMIN.BANNERS.ADMINISTRAR,
            }
          : null;

    if (!configuracao) {
      return NextResponse.json(
        { error: "Contexto de upload inválido." },
        { status: 400 },
      );
    }

    // O contexto fechado define simultaneamente a pasta e a permissão.
    await exigirPermissaoAdmin(configuracao.permissao);
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pasta = configuracao.pasta;

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
    const respostaAutorizacao = traduzirErroAutorizacaoRouteHandler(error);
    if (respostaAutorizacao) return respostaAutorizacao;
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
