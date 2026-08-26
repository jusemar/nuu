import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Footer } from "@/components/common/footer";
import { Container } from "@/components/ui/container";
import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";
import { Header } from "@/features/header";
import { ConteudoPaginaDinamica } from "@/features/paginas-dinamicas/components/store/conteudo-pagina-dinamica";
import { buscarPaginaPublicadaPorSlug } from "@/features/paginas-dinamicas/queries/buscar-pagina-publicada";
import { montarUrlAbsoluta } from "@/lib/seo/url-site";

type Propriedades = { params: Promise<{ slug: string }> };

const buscarPagina = cache(buscarPaginaPublicadaPorSlug);

export async function generateMetadata({
  params,
}: Propriedades): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await buscarPagina(slug);
  if (!pagina) return {};
  const titulo = pagina.tituloSeo || pagina.titulo;
  const descricao =
    pagina.descricaoSeo ||
    `Conheça mais sobre ${pagina.titulo} na ${DADOS_EMPRESA.marca}.`;
  const canonical = montarUrlAbsoluta(`/${pagina.slug}`);
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: titulo,
      description: descricao,
      url: canonical,
    },
  };
}

export default async function PaginaDinamicaPublica({ params }: Propriedades) {
  const { slug } = await params;
  const pagina = await buscarPagina(slug);
  if (!pagina) notFound();

  return (
    <>
      <MarqueeBanner speed={60} />
      <Header />
      <Container as="main" className="py-10 sm:py-14 lg:py-16">
        <article className="mx-auto max-w-3xl">
          <header className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {pagina.titulo}
            </h1>
          </header>
          <div className="text-foreground/90 text-base sm:text-lg">
            <ConteudoPaginaDinamica conteudo={pagina.conteudo} />
          </div>
        </article>
      </Container>
      <Footer />
    </>
  );
}
