// src/app/category/[slug]/page.tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import { Header } from "@/features/header/components/Header";
import { Footer } from "@/components/common/footer";

// Componentes da feature category
import { CategoryFilter } from "@/features/store/category/components/CategoryFilter";
import { CategoryTabs } from "@/features/store/category/components/CategoryTabs";
import { MobileFilterDrawer } from "@/features/store/category/components/MobileFilterDrawer";
import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { SortSection } from "@/components/common/wrappers/sort-section";
import { CategoryProductCard } from "@/features/store/category/components/CategoryProductCard";

// Services
import { getSubcategoryTabs } from "@/features/store/category/services/categoryTabsService";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { slug } = await params;

  // =================================================================
  // PASSO 1: Buscar dados da categoria atual
  // =================================================================
  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.slug, slug),
  });

  if (!category) return notFound();

  // =================================================================
  // PASSO 2: Buscar produtos da categoria com todos os relacionamentos
  // =================================================================
  // - galleryImages: imagens da galeria do produto (para o card)
  // - variants: variantes do produto (fallback para preço/imagem)
  // - pricing: tabela de preços (contém o preço principal)
  // =================================================================
  const products = await db.query.productTable.findMany({
    where: eq(productTable.categoryId, category.id),
    with: {
      galleryImages: true,
      variants: true,
      pricing: true,
    },
  });

  // =================================================================
  // PASSO 3: Buscar subcategorias para as tabs
  // =================================================================
  const subcategoryTabs = await getSubcategoryTabs(category.id);
  const activeFiltersCount = 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* =========================================================== */}
      {/* HERO / TÍTULO DA CATEGORIA */}
      {/* =========================================================== */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
            {category?.name || "Categoria"}
          </h2>
          <p className="mt-3 max-w-3xl text-gray-600">
            Encontre os melhores {category?.name || "Categoria"} com qualidade e
            preço imperdível.
          </p>
        </div>
      </section>

      {/* =========================================================== */}
      {/* LAYOUT PRINCIPAL: SIDEBAR + CONTEÚDO */}
      {/* =========================================================== */}
      <div className="mx-auto max-w-7xl min-w-[375px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* ========================================================= */}
          {/* SIDEBAR FILTROS - DESKTOP */}
          {/* ========================================================= */}
          <aside className="hidden flex-shrink-0 self-start lg:sticky lg:top-20 lg:block lg:w-64 xl:w-72">
            <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Filtrar por
              </h3>
              <CategoryFilter />
            </div>
          </aside>

          {/* ========================================================= */}
          {/* CONTEÚDO PRINCIPAL */}
          {/* ========================================================= */}
          <main className="flex-1">
            {/* Mobile: Drawer para filtro */}
            <div className="mb-6 lg:hidden">
              <MobileFilterDrawer activeFiltersCount={activeFiltersCount} />
            </div>

            {/* Breadcrumb + Ordenação (desktop) */}
            <div className="mb-6 hidden items-center justify-between lg:flex">
              <CategoryBreadcrumb categoryName={category.name} />
              <SortSection />
            </div>

            {/* Tabs de subcategorias */}
            <div className="mb-8">
              <CategoryTabs tabs={subcategoryTabs} />
            </div>

            {/* ========================================================= */}
            {/* GRADE DE PRODUTOS */}
            {/* ========================================================= */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  // ===================================================
                  // 1. PEGAR IMAGEM PRINCIPAL DA GALERIA
                  // ===================================================
                  const primaryImage =
                    product.galleryImages?.find((img) => img.isPrimary) ||
                    product.galleryImages?.[0];

                  // ===================================================
                  // 2. PEGAR PREÇO PRINCIPAL DA TABELA pricing
                  // ===================================================
                  // A tabela product_pricing armazena diferentes tipos de preço
                  // O preço principal é marcado com mainCardPrice = true
                  // ===================================================
                  // ===================================================
                  // 2. PEGAR PREÇO PRINCIPAL DA TABELA pricing
                  // ===================================================
                  const mainPricing = product.pricing?.find(
                    (p) => p.mainCardPrice === true,
                  );

                  // PREÇO ATUAL (se tiver promoção, usa o promocional, senão usa o normal)
                  const productPrice = mainPricing?.hasPromo
                    ? mainPricing.promoPrice
                    : mainPricing?.price || 0;

                  // PREÇO ORIGINAL (só existe se tiver promoção - para mostrar riscado)
                  const originalPrice = mainPricing?.hasPromo
                    ? mainPricing.price
                    : null;
                  // ===================================================
                  // 3. CONVERTER BOOLEANOS (null -> undefined)
                  // ===================================================
                  const hasFreeShipping = product.hasFreeShipping ?? undefined;
                  const hasFlashSale =
                    product.storeProductFlags?.includes("flash_sale");
                  const hasBestPrice =
                    product.storeProductFlags?.includes("best_price");

                  return (
                    <CategoryProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      imageUrl={primaryImage?.imageUrl}
                      price={productPrice ?? 0}
                      originalPrice={originalPrice} // Se tiver promoção, mostra preço original riscado
                      hasFreeShipping={hasFreeShipping}
                      hasFlashSale={hasFlashSale}
                      hasBestPrice={hasBestPrice}
                    />
                  );
                })}
              </div>
            ) : (
              // Mensagem quando não há produtos
              <div className="rounded-xl border border-gray-200 bg-white py-20 text-center">
                <p className="mb-3 text-xl font-medium text-gray-600">
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

      {/* =========================================================== */}
      {/* SEO FOOTER */}
      {/* =========================================================== */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">
            Confira nossa linha completa de {category.name} com os melhores
            preços e condições especiais. Frete rápido para todo o Brasil.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryPage;
