import { BadgePercent, Truck } from "lucide-react";

import { Footer } from "@/components/common/footer";
import { InfoCards } from "@/components/common/info-cards";
import SectionTitle from "@/components/common/section-title";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { Secao } from "@/components/ui/secao";
import { getCategories } from "@/data/categories/get";
import { CampoMensagemAtendente } from "@/features/atendimento-ia";
import {
  AreaBannersHome,
  buscarBannersHomeAtivos,
} from "@/features/banners-home";
import { CategorySelector } from "@/features/category-selector/components/CategorySkeleton";
import { DealsGrid } from "@/features/deals/components/DealsGrid";
import { buscarOfertasHome } from "@/features/deals/queries/buscar-ofertas-home";
import FeaturedProductsCarousel from "@/features/featured-products-carousel/components/FeaturedProductsCarousel";
import { Header } from "@/features/header";
import { ProductGridWithLoadMore } from "@/features/product-grid-with-load-more/components/ProductGridWithLoadMore";

// Mini banners laterais seguem o header: azul como identidade e âmbar só comercial.
const SIDE_BANNERS = [
  {
    Icone: Truck,
    title: "Frete Grátis",
    subtitle: "Acima de R$ 299",
    description: "Entregas em todo o Brasil",
    className: "border-primary/15 bg-primary text-primary-foreground",
    iconClassName: "bg-white/12 text-white",
    subtitleClassName: "text-blue-100",
  },
  {
    Icone: BadgePercent,
    title: "Primeira Compra",
    subtitle: "10% de desconto",
    description: "Use o cupom PRIMEIRA10 no checkout",
    className:
      "border-accent-brand/30 bg-accent-brand-light text-accent-foreground",
    iconClassName: "bg-accent-brand text-white",
    subtitleClassName: "text-accent-dark",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const Home = async () => {
  const [categories, ofertasHome, bannersHome] = await Promise.all([
    getCategories(),
    buscarOfertasHome(),
    buscarBannersHomeAtivos(),
  ]);

  return (
    <>
      {/* ── 1. Marquee ── */}
      <MarqueeBanner speed={60} />

      {/* ── 2. Header ── */}
      <Header />

      {/* ── 3. Conteúdo ── */}
      <Container
        as="main"
        className="mb-14 space-y-10 pt-4 sm:pt-5 md:space-y-12"
      >
        <h1 className="sr-only">Do Rocha — sua loja virtual</h1>

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
            <Card className="min-h-80 overflow-hidden py-0 lg:col-span-2">
              <FeaturedProductsCarousel />
            </Card>

            {/* Mini banners — design system */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {SIDE_BANNERS.map((banner) => (
                <div
                  key={banner.title}
                  className={`shadow-elevation hover:shadow-elevation-lg flex min-h-[150px] flex-col justify-center rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 sm:min-h-[170px] lg:min-h-0 lg:flex-1 ${banner.className}`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${banner.iconClassName}`}
                    >
                      <banner.Icone className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm leading-tight font-semibold">
                        {banner.title}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-medium ${banner.subtitleClassName}`}
                      >
                        {banner.subtitle}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed opacity-75">
                    {banner.description}
                  </p>
                </div>
              ))}
            </div>
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
