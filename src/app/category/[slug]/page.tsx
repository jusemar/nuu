// src/app/category/[slug]/page.tsx
import { CategoryFilter } from '@/features/store/category/components/CategoryFilter';
import { CategoryTabs } from '@/features/store/category/components/CategoryTabs';
import { MobileFilterDrawer } from '@/features/store/category/components/MobileFilterDrawer';
import { CategoryBreadcrumb } from '@/components/common/category-breadcrumb';
import { SortSection } from '@/components/common/wrappers/sort-section';
import { Header } from '@/features/header/components/Header';
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import { notFound } from "next/navigation";
import { getSubcategoryTabs } from '@/features/store/category/services/categoryTabsService';
import { Footer } from "@/components/common/footer";
import { CategoryProductCard } from '@/features/store/category/components/CategoryProductCard';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { slug } = await params;
  
  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.slug, slug),
  });
  
  if (!category) return notFound();

  // Busca produtos com imagens da galeria e variantes
  const products = await db.query.productTable.findMany({
    where: eq(productTable.categoryId, category.id),
    with: { 
      galleryImages: true,
      variants: true 
    },
  });

  const subcategoryTabs = await getSubcategoryTabs(category.id);
  const activeFiltersCount = 0;

  return (
    <div className="min-h-screen bg-gray-50">
    
      <Header />
      
      {/* Hero / Título da categoria */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{category?.name || "Categoria"}</h2>
          <p className="mt-3 text-gray-600 max-w-3xl">
            Encontre os melhores {category?.name || "Categoria"} com qualidade e preço imperdível.
          </p>
        </div>
      </section>

      {/* Layout principal: sidebar + conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-[375px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* Sidebar filtros - desktop */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0 lg:sticky lg:top-20 self-start">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Filtrar por</h3>
              <CategoryFilter />
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="flex-1">
            
            {/* Mobile: Drawer para filtro */}
            <div className="lg:hidden mb-6">
              <MobileFilterDrawer activeFiltersCount={activeFiltersCount} />
            </div>

            {/* Breadcrumb + Ordenação (desktop) */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <CategoryBreadcrumb categoryName={category.name} />
              <SortSection />
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <CategoryTabs tabs={subcategoryTabs} />
            </div>

            {/* Produtos usando CategoryProductCard - COM PREÇOS CORRIGIDOS */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => {
                  // =====================================================
                  // 1. PEGA A IMAGEM PRINCIPAL DA GALERIA
                  // =====================================================
                  const primaryImage = product.galleryImages?.find(img => img.isPrimary) || 
                                      product.galleryImages?.[0];
                  
                  // =====================================================
                  // 2. PEGA O PREÇO CORRETO
                  // Prioridade:
                  //   - salePrice do produto (campo direto)
                  //   - priceInCents da primeira variante
                  //   - 0 como fallback
                  // =====================================================
                  const productPrice = product.salePrice || 
                                      product.variants?.[0]?.priceInCents || 
                                      0;
                  
                  // =====================================================
                  // 3. PEGA O PREÇO ORIGINAL (para desconto)
                  // Prioridade:
                  //   - costPrice do produto
                  //   - comparePriceInCents da primeira variante
                  // =====================================================
                  const originalPrice = product.costPrice || 
                                       product.variants?.[0]?.comparePriceInCents;
                  
                  return (
                    <CategoryProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      imageUrl={primaryImage?.imageUrl}
                      description={product.cardShortText || product.description}
                      price={productPrice}
                      originalPrice={originalPrice}
                      hasFreeShipping={product.hasFreeShipping}
                      hasFlashSale={product.storeProductFlags?.includes('flash_sale')}
                      hasBestPrice={product.storeProductFlags?.includes('best_price')}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
                <p className="text-xl font-medium text-gray-600 mb-3">
                  Nenhum produto encontrado nesta categoria
                </p>
                <p className="text-gray-500">
                  Tente usar outros filtros ou navegar por outras categorias.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* SEO FOOTER */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">
            Confira nossa linha completa de {category.name} com os melhores preços 
            e condições especiais. Frete rápido para todo o Brasil.
          </p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default CategoryPage;