
import { CategoryFilter } from '@/features/store/category/components/CategoryFilter';
import { CategoryTabs } from '@/features/store/category/components/CategoryTabs';
import { MobileFilterDrawer } from '@/features/store/category/components/MobileFilterDrawer';
import { CategoryBreadcrumb } from '@/components/common/category-breadcrumb';
import { SortSection } from '@/components/common/wrappers/sort-section';
import ProductItem from '@/components/common/product-item';
import { Header } from '@/features/header/components/Header';
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import { notFound } from "next/navigation";
import { getSubcategoryTabs } from '@/features/store/category/services/categoryTabsService';
import { Footer } from "@/components/common/footer";

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

            {/* Produtos ou vazio */}
            <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
              <p className="text-xl font-medium text-gray-600 mb-3">
                Nenhum produto encontrado nesta categoria
              </p>
              <p className="text-gray-500">
                Tente usar outros filtros ou navegar por outras categorias.
              </p>
            </div>
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
}
export default CategoryPage;