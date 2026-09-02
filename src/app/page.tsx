import { Footer } from "@/components/common/footer";
import { InfoCards } from "@/components/common/info-cards";
import SectionTitle from "@/components/common/section-title";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Secao } from "@/components/ui/secao";
import { getCategories } from "@/data/categories/get";
import { CampoMensagemAtendente } from "@/features/atendimento-ia";
import {
  AreaBannersHome,
  BannersSecundariosNovidades,
  buscarBannersHomeAtivos,
} from "@/features/banners-home";
import { CategorySelector } from "@/features/category-selector/components/CategorySkeleton";
import { BarraAvisos } from "@/features/configuracoes-loja/components/store/barra-avisos";
import { buscarBarraAvisos } from "@/features/configuracoes-loja/queries/buscar-barra-avisos";
import { DealsGrid } from "@/features/deals/components/DealsGrid";
import { buscarOfertasHome } from "@/features/deals/queries/buscar-ofertas-home";
import FeaturedProductsCarousel from "@/features/featured-products-carousel/components/FeaturedProductsCarousel";
import { Header } from "@/features/header";
import { ProductGridWithLoadMore } from "@/features/product-grid-with-load-more/components/ProductGridWithLoadMore";

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const Home = async () => {
  const [categories, ofertasHome, bannersHome, barraAvisos] = await Promise.all(
    [
      getCategories(),
      buscarOfertasHome(),
      buscarBannersHomeAtivos(),
      buscarBarraAvisos(),
    ],
  );
  const temBannersSecundariosNovidades = Boolean(
    bannersHome.novidadesSecundarioEsquerdo ||
      bannersHome.novidadesSecundarioDireito,
  );

  return (
    <>
      {/* ── 1. Marquee ── */}
      <BarraAvisos configuracao={barraAvisos} />

      {/* ── 2. Header ── */}
      <Header />

      {/* ── 3. Conteúdo ── */}
      <Container
        as="main"
        className="mb-14 space-y-10 pt-4 sm:pt-5 md:space-y-12"
      >
        <h1 className="sr-only">Nooo — loja online</h1>

        {/* Banner carousel */}
        <Card
          role="region"
          aria-label="Banners promocionais"
          className="border-border/80 bg-card shadow-elevation gap-0 overflow-hidden rounded-xl border py-0"
        >
          <AreaBannersHome banners={bannersHome} />
        </Card>

        <CampoMensagemAtendente
          titulo="Olá! O que você procura hoje?"
          placeholder="Digite o que procura ou faça uma pergunta"
          apoio="Ex.: produto para meu carro, prazo de entrega ou recomendação"
          contexto={{ tipo: "home" }}
        />

        {/* Info cards — confiança e conversão */}
        <InfoCards />

        {/* Deals / Flash sale */}
        <Secao aria-label="Ofertas em destaque">
          <SectionTitle icon="flame">Ofertas Especiais</SectionTitle>
          <DealsGrid
            produtosOfertaRelampago={ofertasHome.produtosOfertaRelampago}
            produtosPromocaoNormal={ofertasHome.produtosPromocaoNormal}
          />
        </Secao>

        {/* Novidades — carousel + mini banners */}
        <Secao aria-label="Novidades">
          <SectionTitle icon="star">Novidades</SectionTitle>

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
            {/* Carousel de destaque */}
            <Card
              className={`min-h-80 overflow-hidden py-0 ${
                temBannersSecundariosNovidades
                  ? "lg:col-span-2"
                  : "lg:col-span-3"
              }`}
            >
              <FeaturedProductsCarousel />
            </Card>

            <BannersSecundariosNovidades banners={bannersHome} />
          </div>
        </Secao>

        {/* Categorias */}
        <section aria-label="Categorias">
          <CategorySelector
            categories={categories}
            isLoading={!categories?.length}
          />
        </section>

        {/* Descoberta de produtos gerais */}
        <Secao id="confira-tambem" aria-label="Confira também">
          <SectionTitle icon="star">Confira também</SectionTitle>
          <ProductGridWithLoadMore />
        </Secao>

        {/* Footer */}
        <Footer />
      </Container>
    </>
  );
};

export default Home;
