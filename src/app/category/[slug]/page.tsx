// src/app/category/[slug]/page.tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categoryTable, productTable } from "@/db/schema";
import Navbar08 from "@/components/ui/shadcn-io/navbar-08";
import ProductItem from "@/components/common/product-item";
import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { SortSection } from "@/components/common/wrappers/sort-section";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { slug } = await params;
  const category = await db.query.categoryTable.findFirst({
    where: eq(categoryTable.slug, slug),
  });
  
  if (!category) {
    return notFound();
  }

  const products = await db.query.productTable.findMany({
    where: eq(productTable.categoryId, category.id),
    with: {
      variants: true,
    },
  });

  return (
    <>
      <Navbar08 />
      
      {/* ÁREA SEO TOPO */}
        
      <div className="bg-gray-50 py-6 px-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          <p className="text-muted-foreground">
            Encontre os melhores {category.name} com qualidade e preço imperdível
          </p>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-5 py-6">
        <div className="flex gap-8">
          
          {/* SIDEBAR FILTROS (esquerda) */}
          <aside className="w-80 hidden lg:block">
            {/* Aqui virá o SidebarMenu collapsible */}
            <div className="bg-muted p-4 rounded-lg">
              Filtros aparecerão aqui
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL (direita) */}
           <main className="flex-1">
            {/* Breadcrumb e Ordenação */}
                      {/* Breadcrumb e Ordenação */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <CategoryBreadcrumb categoryName={category.name} />
                <SortSection />
              </div>
            </div>

           {/* Grid de Produtos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductItem
                    key={product.id}
                    product={product}              
                  />
                ))}
              </div>

          </main>

        </div>
      </div>

      {/* ÁREA SEO RODAPÉ */}
      <div className="bg-gray-50 py-6 px-5 mt-8">
        <div className="max-w-7xl mx-auto">
           Aqui virão mais títulos/frases SEO 
        </div>
      </div>
    </>
  );
};

export default CategoryPage;