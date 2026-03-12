// src/app/category/[slug]/page.tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import Navbar08 from "@/components/ui/shadcn-io/navbar-08";
import ProductItem from "@/components/common/product-item";
import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { SortSection } from "@/components/common/wrappers/sort-section";
import { Footer } from "@/components/common/footer";
import { CategoryFilter } from "@/features/store/category/components/CategoryFilter";
import { MobileFilterDrawer } from "@/features/store/category/components/MobileFilterDrawer";
import { CategoryTabs } from "@/features/store/category/components/CategoryTabs";
import { getSubcategoryTabs } from '@/features/store/category/services/categoryTabsService';
import { Header } from '@/features/header/components/Header';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { slug } = await params;
  
  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.slug, slug),
  });
  
  if (!category) return notFound();

  const products = await db.query.productTable.findMany({
    where: eq(productTable.categoryId, category.id),
    with: { variants: true },
  });

  const subcategoryTabs = await getSubcategoryTabs(category.id);
  const activeFiltersCount = 0;

  return (
    <>
      <Header />
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
            {category.name}
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-3xl mt-2">
            Encontre os melhores {category.name} com qualidade e preço imperdível.
          </p>
        </div>
      </section>

      {/* LAYOUT PRINCIPAL - COPIADO DO TESTE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-[375px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* SIDEBAR FILTROS - DESKTOP (EXATAMENTE COMO NO TESTE) */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0 lg:sticky lg:top-20 self-start">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Filtrar por</h3>
              <CategoryFilter />
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <main className="flex-1">
            
            {/* MOBILE: Drawer para filtro */}
            <div className="lg:hidden mb-6">
              <MobileFilterDrawer activeFiltersCount={activeFiltersCount} />
            </div>

            {/* BREADCRUMB + ORDENAÇÃO (desktop) */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <CategoryBreadcrumb categoryName={category.name} />
              <SortSection />
            </div>

            {/* TABS */}
            {subcategoryTabs.length > 0 && (
              <div className="mb-8">
                <CategoryTabs tabs={subcategoryTabs} />
              </div>
            )}

            {/* PRODUTOS OU VAZIO - COM ESTILO DO TESTE */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
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
    </>
  );
};

export default CategoryPage;