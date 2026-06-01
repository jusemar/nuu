import {
  getProducts,
  getNewProducts,
} from "@/features/store/products/service/getProducts";
import { getCategories } from "@/data/categories/get";
import { buscarOfertasHome } from "@/features/deals/queries/buscar-ofertas-home";
import { BadgePercent, Truck } from "lucide-react";

import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { Header } from "@/features/header";
import {
  AreaBannersHome,
  buscarBannersHomeAtivos,
} from "@/features/banners-home";
import { DealsGrid } from "@/features/deals/components/DealsGrid";
import { CategorySelector } from "@/features/category-selector/components/CategorySkeleton";
import FeaturedProductsCarousel from "@/features/featured-products-carousel/components/FeaturedProductsCarousel";
import { ProductGridWithLoadMore } from "@/features/product-grid-with-load-more/components/ProductGridWithLoadMore";
import { InfoCards } from "@/components/common/info-cards";
import SectionTitle from "@/components/common/section-title";
import { Footer } from "@/components/common/footer";

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
  const [products, newlyCreatedProducts, categories, ofertasHome, bannersHome] =
    await Promise.all([
      getProducts(),
      getNewProducts(),
      getCategories(),
      buscarOfertasHome(),
      buscarBannersHomeAtivos(),
    ]);

  return (
    <>
      {/* ── 1. Marquee ── */}
      <MarqueeBanner
        text="&nbsp;🚚 Frete Grátis acima de R$ 299&nbsp;&nbsp;&nbsp;•&nbsp;🎁 10% off na primeira compra — use PRIMEIRA10&nbsp;&nbsp;&nbsp;•&nbsp;⭐ Garantia em todos os produtos&nbsp;&nbsp;&nbsp;•&nbsp;📦 Entregas para todo o Brasil&nbsp;&nbsp;&nbsp;•&nbsp;🔥 Ofertas com até 50% off"
        speed={60}
      />

      {/* ── 2. Header ── */}
      <Header />

      {/* ── 3. Conteúdo ── */}
      <main className="mx-auto mb-14 w-full max-w-7xl space-y-10 px-4 pt-4 sm:px-6 sm:pt-5 md:space-y-12 lg:px-8">
        {/* Banner carousel */}
        <section
          aria-label="Banners promocionais"
          className="border-border/80 bg-card shadow-elevation overflow-hidden rounded-xl border"
        >
          <AreaBannersHome banners={bannersHome} />
        </section>

        {/* Info cards — confiança e conversão */}
        <InfoCards />

        {/* Deals / Flash sale */}
        <section aria-label="Ofertas em destaque">
          <div className="mb-5 md:mb-6">
            <SectionTitle icon="flame">Ofertas Especiais</SectionTitle>
          </div>
          <DealsGrid
            produtosOfertaRelampago={ofertasHome.produtosOfertaRelampago}
            produtosPromocaoNormal={ofertasHome.produtosPromocaoNormal}
          />
        </section>

        {/* Novidades — carousel + mini banners */}
        <section aria-label="Novidades">
          <div className="mb-5 md:mb-6">
            <SectionTitle icon="star">Chegou agora</SectionTitle>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
            {/* Carousel de destaque */}
            <div className="border-border/80 bg-card shadow-elevation min-h-[320px] rounded-xl border lg:col-span-2">
              <FeaturedProductsCarousel />
            </div>

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
        </section>

        {/* Categorias */}
        <section aria-label="Categorias">
          <CategorySelector
            categories={categories}
            isLoading={!categories?.length}
          />
        </section>

        {/* Produtos em destaque */}
        <section aria-label="Produtos em destaque">
          <div className="mb-5 md:mb-6">
            <SectionTitle icon="flame">Os mais queridos</SectionTitle>
          </div>
          <ProductGridWithLoadMore />
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
};

export default Home;
