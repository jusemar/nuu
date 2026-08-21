import type { Metadata } from "next";

type ProdutoParaMetadata = {
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  galleryImages: Array<{
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean | null;
  }>;
};

/** Transforma conteúdo editorial em uma descrição curta para buscadores. */
function montarDescricaoParaMetadata(texto: string | null | undefined) {
  const semHtml = (texto ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!semHtml) return undefined;
  return semHtml.length > 160 ? `${semHtml.slice(0, 157)}...` : semHtml;
}

/** Mantém Open Graph e Twitter derivados da mesma fonte da metadata da PDP. */
export function montarMetadataProduto({
  produto,
  urlCanonica,
}: {
  produto: ProdutoParaMetadata;
  urlCanonica: string;
}): Metadata {
  const titulo = produto.metaTitle?.trim() || produto.name;
  const descricao =
    montarDescricaoParaMetadata(produto.metaDescription) ??
    montarDescricaoParaMetadata(produto.description);
  const imagemPrincipal =
    produto.galleryImages.find((imagem) => imagem.isPrimary) ??
    produto.galleryImages[0];
  const urlImagem = imagemPrincipal?.imageUrl.trim();
  const altImagem = imagemPrincipal?.altText?.trim() || produto.name;
  const imagem = urlImagem ? { url: urlImagem, alt: altImagem } : undefined;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: urlCanonica },
    openGraph: {
      // A Metadata API não oferece `product`; `website` é o tipo compatível.
      type: "website",
      url: urlCanonica,
      title: titulo,
      description: descricao,
      images: imagem ? [imagem] : undefined,
    },
    twitter: {
      card: imagem ? "summary_large_image" : "summary",
      title: titulo,
      description: descricao,
      images: imagem ? [imagem] : undefined,
    },
  };
}
