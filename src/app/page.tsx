import { Navbar08 } from "@/components/ui/shadcn-io/navbar-08"
import { desc } from "drizzle-orm";
import Image from "next/image";

import CategorySelector from "@/components/common/category-selector";
import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import ProductList from "@/components/common/product-list";
import { db } from "@/db";
import { productTable } from "@/db/schema";
import { getNewlyCreatedProducts, getProductsWithVariants } from "@/data/products/get";
import { get } from "http";
import { getCategories } from "@/data/categories/get";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { MarqueeBanner } from "@/components/ui/MarqueeBanner";

const Home = async () => {

  const [products, newlyCreatedProducts, categories] = await Promise.all([
    getProductsWithVariants(),
    getNewlyCreatedProducts(),
    getCategories()
  ]); 

  return (
    <>
    
    <MarqueeBanner 
  text="&nbsp;🚚 Frete Grátis acima de R$ 100&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; •&nbsp;🎁 10% off na primeira compra &nbsp;&nbsp;&nbsp;&nbsp; •&nbsp;⭐ Produtos com garantia &nbsp;&nbsp;&nbsp;•&nbsp;📦 Entregas para todo Brasil &nbsp;&nbsp;&nbsp;•&nbsp;🔥 Ofertas com até 50% off"
  speed={60}
/>
<Navbar08 />
      <Header />     
  
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
 
        <ProductList products={products} title="Mais vendidos" />

        <div className="px-5">
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
        </div>

        <ProductList products={newlyCreatedProducts} title="Novos produtos" />
        <Footer />
      </div>
    </>
  );
};

export default Home;   