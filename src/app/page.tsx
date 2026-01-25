import { desc } from "drizzle-orm";
import Image from "next/image";

import { CategorySelector } from "@/features/category-selector/components/CategorySkeleton";
import ProductCarousel from "@/components/common/product-carousel";
import { Footer } from "@/components/common/footer";
import RotatingProductCarousel from "@/features/product-carousel/components/RotatingProductCarousel";
import ProductList from "@/components/common/product-list";
import { db } from "@/db";
import { productTable } from "@/db/schema";
import { getNewlyCreatedProducts, getProductsWithVariants } from "@/data/products/get";
import { getCategories } from "@/data/categories/get";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { DealsGrid } from "@/features/deals/components/DealsGrid";
import { InfoCards } from "@/components/common/info-cards";
import SectionTitle from "@/components/common/section-title";
import ClientHeader from "@/components/layout/ClientHeader";
import FeaturedProductsCarousel from "@/features/featured-products-carousel/components/FeaturedProductsCarousel";
import { ProductGridWithLoadMore } from "@/features/product-grid-with-load-more/components/ProductGridWithLoadMore";
import { Header } from '@/features/header';

const Home = async () => {
  const [products, newlyCreatedProducts, categories] = await Promise.all([
    getProductsWithVariants(),
    getNewlyCreatedProducts(),
    getCategories(),
  ]);

  const flashDealEndDate = "2025-09-28T11:02:00";

  return (
    <>
      <MarqueeBanner
        text="&nbsp;🚚 Frete Grátis acima de R$ 100&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; •&nbsp;🎁 10% off na primeira compra &nbsp;&nbsp;&nbsp;&nbsp; •&nbsp;⭐ Produtos com garantia &nbsp;&nbsp;&nbsp;•&nbsp;📦 Entregas para todo Brasil &nbsp;&nbsp;&nbsp;•&nbsp;🔥 Ofertas com até 50% off"
        speed={60}
      />

      <ClientHeader />
      <Header />

      <div className="max-w-7xl mx-auto px-4 mt-6 mb-32">
        {/* Banner Carousel limpo e profissional */}
        <div className="mb-10 rounded-xl overflow-hidden">
          <BannerCarousel
            banners={[
              {
                mobileSrc: "/banner-promocao.webp",
                desktopSrc: "/banner-promocao.webp",
                alt: "Promoção Especial Do Rocha",
              },
              {
                mobileSrc: "/banner-promocao.webp",
                desktopSrc: "/banner-promocao.webp",
                alt: "Ofertas Exclusivas",
              },
            ]}
          />
        </div>

        {/* INFO CARDS PROFISSIONAIS - QUARTO PASSO */}
        <div className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Card 1 - Entrega */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30 rounded-2xl p-5 lg:p-6 border border-blue-100 dark:border-blue-900/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">🚚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Entrega Rápida</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Entregamos em até 48h para SP</p>
              <div className="pt-3 border-t border-blue-50 dark:border-blue-900/20">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Ver zonas de entrega →</span>
              </div>
            </div>

            {/* Card 2 - Pagamento */}
            <div className="group relative bg-gradient-to-br from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950/30 rounded-2xl p-5 lg:p-6 border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pagamento Seguro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Parcelamos em até 12x sem juros</p>
              <div className="pt-3 border-t border-emerald-50 dark:border-emerald-900/20">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Métodos de pagamento →</span>
              </div>
            </div>

            {/* Card 3 - Garantia */}
            <div className="group relative bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/30 rounded-2xl p-5 lg:p-6 border border-amber-100 dark:border-amber-900/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">⭐</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Garantia Estendida</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">12 meses de garantia em todos produtos</p>
              <div className="pt-3 border-t border-amber-50 dark:border-amber-900/20">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Saiba mais →</span>
              </div>
            </div>

            {/* Card 4 - Suporte */}
            <div className="group relative bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 rounded-2xl p-5 lg:p-6 border border-purple-100 dark:border-purple-900/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-4 right-4 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-xl">🛟</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Suporte 24/7</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Atendimento via chat, WhatsApp e telefone</p>
              <div className="pt-3 border-t border-purple-50 dark:border-purple-900/20">
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Fale conosco →</span>
              </div>
            </div>
          </div>
        </div>

        {/* O componente InfoCards original continua funcionando, apenas oculto */}
        <div className="hidden">
          <InfoCards />
        </div>

        <DealsGrid
          flashDealProduct={products[0]}
          flashDealEndDate={flashDealEndDate}
        />

        <div className="mb-10 mt-12">
          <SectionTitle icon="star">Novidades</SectionTitle>
        </div>

        <div className="max-w-6xl mx-auto mt-10 mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-stretch">
            <div className="lg:col-span-2 h-80">
              <FeaturedProductsCarousel />
            </div>

            <div className="flex flex-col gap-3 h-80">
              <div className="flex-1 min-h-0">
                <div className="h-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white shadow-lg flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 p-1.5 rounded-full">
                      <span className="text-lg">🚚</span>
                    </div>
                    <div>
                      <h3 className="font-bold">Frete Grátis</h3>
                      <p className="text-blue-100 text-xs">Acima de R$ 99</p>
                    </div>
                  </div>
                  <p className="text-xs">Entregas em todo Brasil</p>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <div className="h-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-3 text-white shadow-lg flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 p-1.5 rounded-full">
                      <span className="text-lg">🎁</span>
                    </div>
                    <div>
                      <h3 className="font-bold">Ofertas Exclusivas</h3>
                      <p className="text-amber-100 text-xs">Só para você</p>
                    </div>
                  </div>
                  <p className="text-xs">Ofertas personalizadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ CATEGORY SELECTOR */}
        <div className="mx-auto px-4 mt-10 mb-32">
          <CategorySelector
            categories={categories}
            isLoading={!categories?.length}
          />
        </div>

        <SectionTitle icon="flame">Destaque</SectionTitle>

        <div className="max-w-7xl mx-auto px-4 mt-10 mb-32">
          <ProductGridWithLoadMore />
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Home;