import { getProducts, getNewProducts } from "@/features/store/products/service/getProducts";
import { getCategories } from "@/data/categories/get";

import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { Header } from "@/features/header";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { DealsGrid } from "@/features/deals/components/DealsGrid";
import { CategorySelector } from "@/features/category-selector/components/CategorySkeleton";
import FeaturedProductsCarousel from "@/features/featured-products-carousel/components/FeaturedProductsCarousel";
import { ProductGridWithLoadMore } from "@/features/product-grid-with-load-more/components/ProductGridWithLoadMore";
import { InfoCards } from "@/components/common/info-cards";
import SectionTitle from "@/components/common/section-title";
import { Footer } from "@/components/common/footer";

// ─── Constantes ───────────────────────────────────────────────────────────────
const FLASH_DEAL_END_DATE = "2025-09-28T11:02:00";

const BANNERS = [
  {
    mobileSrc:  "/banner-promocao.webp",
    desktopSrc: "/banner-promocao.webp",
    alt: "Promoção Especial Do Rocha",
  },
  {
    mobileSrc:  "/banner-promocao.webp",
    desktopSrc: "/banner-promocao.webp",
    alt: "Ofertas Exclusivas",
  },
];

// Info cards — azul primário, teal (sucesso) e âmbar (destaque)
// seguem o design system: #0C447C · #14B8A6 · #EF9F27
const INFO_CARDS = [
  {
    icon: "🚚",
    title: "Entrega Rápida",
    description: "Entregamos em até 48h para SP e principais capitais",
    link: "Ver zonas de entrega",
    bg:        "from-white to-[#EFF6FF] dark:from-gray-900 dark:to-blue-950/20",
    border:    "border-[#BFDBFE] dark:border-blue-900/30",
    iconBg:    "bg-[#EFF6FF] dark:bg-blue-900/30",
    linkColor: "text-[#0C447C] dark:text-blue-400",
    divider:   "border-[#DBEAFE] dark:border-blue-900/20",
  },
  {
    icon: "💳",
    title: "Pagamento Seguro",
    description: "Parcelamos em até 12x sem juros no cartão",
    link: "Ver métodos de pagamento",
    bg:        "from-white to-[#F0FDFA] dark:from-gray-900 dark:to-teal-950/20",
    border:    "border-[#99F6E4] dark:border-teal-900/30",
    iconBg:    "bg-[#F0FDFA] dark:bg-teal-900/30",
    linkColor: "text-[#0F766E] dark:text-teal-400",
    divider:   "border-[#CCFBF1] dark:border-teal-900/20",
  },
  {
    icon: "⭐",
    title: "Garantia Estendida",
    description: "12 meses de garantia em todos os produtos",
    link: "Saiba mais",
    bg:        "from-white to-[#FFFBEB] dark:from-gray-900 dark:to-amber-950/20",
    border:    "border-[#FDE68A] dark:border-amber-900/30",
    iconBg:    "bg-[#FFFBEB] dark:bg-amber-900/30",
    linkColor: "text-[#B45309] dark:text-amber-400",
    divider:   "border-[#FEF3C7] dark:border-amber-900/20",
  },
  {
    icon: "🛟",
    title: "Suporte 24/7",
    description: "Atendimento via chat, WhatsApp e telefone",
    link: "Fale conosco",
    bg:        "from-white to-[#EFF6FF] dark:from-gray-900 dark:to-blue-950/20",
    border:    "border-[#BFDBFE] dark:border-blue-900/30",
    iconBg:    "bg-[#EFF6FF] dark:bg-blue-900/30",
    linkColor: "text-[#0C447C] dark:text-blue-400",
    divider:   "border-[#DBEAFE] dark:border-blue-900/20",
  },
];

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
  const [products, newlyCreatedProducts, categories] = await Promise.all([
    getProducts(),
    getNewProducts(),
    getCategories(),
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
      <main className="max-w-7xl mx-auto px-4 mt-6 mb-16 space-y-16">

        {/* Banner carousel */}
        <section aria-label="Banners promocionais" className="rounded-2xl overflow-hidden shadow-elevation">
          <BannerCarousel banners={BANNERS} />
        </section>

        {/* Info cards — confiança e conversão */}
        <section aria-label="Diferenciais da loja">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INFO_CARDS.map((card) => (
              <div
                key={card.title}
                className={`
                  group relative bg-gradient-to-br ${card.bg}
                  rounded-2xl p-5 lg:p-6
                  border ${card.border}
                  shadow-sm hover:shadow-elevation
                  transition-all duration-300 hover:-translate-y-1
                `}
              >
                {/* Ícone flutuante */}
                <div
                  className={`
                    absolute top-4 right-4 w-10 h-10 ${card.iconBg}
                    rounded-full flex items-center justify-center
                    group-hover:scale-110 transition-transform duration-300
                  `}
                >
                  <span className="text-xl" role="img" aria-hidden="true">{card.icon}</span>
                </div>

                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5 pr-12">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {card.description}
                </p>
                <div className={`pt-3 border-t ${card.divider}`}>
                  <span className={`text-xs font-semibold ${card.linkColor} cursor-pointer`}>
                    {card.link} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* InfoCards original preservado oculto — não remover */}
        <div className="hidden" aria-hidden="true">
          <InfoCards />
        </div>

        {/* Deals / Flash sale */}
        <section aria-label="Ofertas em destaque">
          <div className="mb-8">
            <SectionTitle icon="flame">Ofertas Especiais</SectionTitle>
          </div>
          <DealsGrid
            flashDealProduct={products[0]}
            flashDealEndDate={FLASH_DEAL_END_DATE}
          />
        </section>

        {/* Novidades — carousel + mini banners */}
        <section aria-label="Novidades">
          <div className="mb-8">
            <SectionTitle icon="star">Chegou agora</SectionTitle>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Carousel de destaque */}
            <div className="lg:col-span-2 h-80">
              <FeaturedProductsCarousel />
            </div>

            {/* Mini banners — design system */}
            <div className="flex flex-col gap-4 h-80">
              {SIDE_BANNERS.map((banner) => (
                <div key={banner.title} className="flex-1 min-h-0">
                  <div
                    className={`
                      h-full rounded-2xl bg-gradient-to-br ${banner.bg}
                      p-4 text-white shadow-elevation
                      flex flex-col justify-center
                      cursor-pointer hover:opacity-95 transition-opacity
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
                        <span className="text-lg" role="img" aria-hidden="true">{banner.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{banner.title}</p>
                        <p className={`text-xs ${banner.subtitleColor}`}>{banner.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">{banner.description}</p>
                  </div>
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
