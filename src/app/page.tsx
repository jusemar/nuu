import {
  getProducts,
  getNewProducts,
} from "@/features/store/products/service/getProducts";
import { getCategories } from "@/data/categories/get";
import { buscarOfertasHome } from "@/features/deals/queries/buscar-ofertas-home";

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

// Mini banners laterais — design system: azul primário e âmbar
const SIDE_BANNERS = [
  {
    icon: "🚚",
    title: "Frete Grátis",
    subtitle: "Acima de R$ 299",
    description: "Entregas em todo o Brasil",
    bg: "from-[#0C447C] to-[#1E3A8A]",
    subtitleColor: "text-blue-200",
  },
  {
    icon: "🎁",
    title: "Primeira Compra",
    subtitle: "10% de desconto",
    description: "Use o cupom PRIMEIRA10 no checkout",
    bg: "from-[#EF9F27] to-[#B45309]",
    subtitleColor: "text-amber-100",
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
      <main className="mx-auto mt-6 mb-16 max-w-7xl space-y-16 px-4">
        {/* Banner carousel */}
        <section
          aria-label="Banners promocionais"
          className="shadow-elevation overflow-hidden rounded-2xl"
        >
          <AreaBannersHome banners={bannersHome} />
        </section>

        {/* Info cards — confiança e conversão */}
        <InfoCards />

        {/* Deals / Flash sale */}
        <section aria-label="Ofertas em destaque">
          <div className="mb-8">
            <SectionTitle icon="flame">Ofertas Especiais</SectionTitle>
          </div>
          <DealsGrid
            produtosOfertaRelampago={ofertasHome.produtosOfertaRelampago}
            produtosPromocaoNormal={ofertasHome.produtosPromocaoNormal}
          />
        </section>

        {/* Novidades — carousel + mini banners */}
        <section aria-label="Novidades">
          <div className="mb-8">
            <SectionTitle icon="star">Chegou agora</SectionTitle>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
            {/* Carousel de destaque */}
            <div className="h-[360px] lg:col-span-2">
              <FeaturedProductsCarousel />
            </div>

            {/* Mini banners — design system */}
            <div className="flex h-[360px] flex-col gap-4">
              {SIDE_BANNERS.map((banner) => (
                <div key={banner.title} className="min-h-0 flex-1">
                  <div
                    className={`h-full rounded-2xl bg-gradient-to-br ${banner.bg} shadow-elevation flex cursor-pointer flex-col justify-center p-4 text-white transition-opacity hover:opacity-95`}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex-shrink-0 rounded-full bg-white/20 p-2">
                        <span className="text-lg" role="img" aria-hidden="true">
                          {banner.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm leading-tight font-bold">
                          {banner.title}
                        </p>
                        <p className={`text-xs ${banner.subtitleColor}`}>
                          {banner.subtitle}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-white/80">
                      {banner.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section aria-label="Categorias" className="pt-8 md:pt-10 lg:pt-12">
          <CategorySelector
            categories={categories}
            isLoading={!categories?.length}
          />
        </section>

        {/* Produtos em destaque */}
        <section aria-label="Produtos em destaque">
          <div className="mb-8">
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
