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

      <div className="max-w-7xl mx-auto px-4 mt-10 mb-32">
        <BannerCarousel
          banners={[
            {
              mobileSrc: "/banner-promocao.webp",
              desktopSrc: "/banner-promocao.webp",
              alt: "Banner 1",
            },
            {
              mobileSrc: "/banner-promocao.webp",
              desktopSrc: "/banner-promocao.webp",
              alt: "Banner 2",
            },
          ]}
        />

        <InfoCards />

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
