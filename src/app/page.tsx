import { Navbar08 } from "@/components/ui/shadcn-io/navbar-08/index"
import { desc } from "drizzle-orm";
import Image from "next/image";
import CategorySelector from "@/components/common/category-selector";
import ProductCarousel from "@/components/common/product-carousel";
import {Footer} from "@/components/common/footer";

import ProductList from "@/components/common/product-list";
import { db } from "@/db";
import { productTable } from "@/db/schema";
import { getNewlyCreatedProducts, getProductsWithVariants } from "@/data/products/get";
import { get } from "http";
import { getCategories } from "@/data/categories/get";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { MarqueeBanner } from "@/components/ui/MarqueeBanner";
import { DealsGrid } from "@/components/common/deals-grid";
import { InfoCards } from "@/components/common/info-cards";
import SectionTitle from "@/components/common/section-title";

const Home = async () => {

  const [products, newlyCreatedProducts, categories] = await Promise.all([
    getProductsWithVariants(),
    getNewlyCreatedProducts(),
    getCategories()
  ]); 

  // ⏰ DATA FIXA PARA A OFERTA RELÂMPAGO (24 horas a partir de agora)
 const flashDealEndDate = "2025-09-28T11:02:00";

  return (
    <>
      <MarqueeBanner 
        text="&nbsp;🚚 Frete Grátis acima de R$ 100&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; •&nbsp;🎁 10% off na primeira compra &nbsp;&nbsp;&nbsp;&nbsp; •&nbsp;⭐ Produtos com garantia &nbsp;&nbsp;&nbsp;•&nbsp;📦 Entregas para todo Brasil &nbsp;&nbsp;&nbsp;•&nbsp;🔥 Ofertas com até 50% off"
        speed={60}
      />
      <Navbar08/>
      <div className="space-y-6">
        <BannerCarousel 
          banners={[
            {
              mobileSrc: "/banner-promocao.webp", 
              desktopSrc: "/banner-promocao.webp",
              alt: "Banner 1"
            },
            {
              mobileSrc: "/banner-promocao.webp", 
              desktopSrc: "/banner-promocao.webp",
              alt: "Banner 2"
            }
          ]} 
        /> 
        <InfoCards />
        
        {/* 🎯 DEALS GRID COM DATA FIXA */}
        <DealsGrid 
          flashDealProduct={products[0]} 
          products={products}
          flashDealEndDate={flashDealEndDate}
        />  
        
 
          <SectionTitle icon="star">Novidades</SectionTitle>
          <ProductList products={newlyCreatedProducts} />

     {/*     <div className="px-5">
          <CategorySelector categories={categories} />
        </div>

       <div className="px-5">
          <Image
            src="/banner-02.png"
            alt="Leve uma vida com estilo"
            height={0}
            width={0}
            sizes="100vw"
            className="h-auto w-full"
          />
        </div>*/}

          <SectionTitle icon="flame">Destaque</SectionTitle>
          <ProductList products={newlyCreatedProducts} />

        <ProductCarousel products={products} title="Mais vendidos" /> 
          <Footer />       
        
      </div>
    </>
  );
};

export default Home;