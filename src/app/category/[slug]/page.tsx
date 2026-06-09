// src/app/category/[slug]/page.tsx
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/connection";
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
import {
  adaptarPrecosVitrine,
  type PrecosVitrineNormalizados,
} from "@/features/precificacao";

// Services
import { getSubcategoryTabs } from "@/features/store/category/services/categoryTabsService";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type ItemFiltro = {
  id: string;
  name: string;
  count: number;
};

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
  const { slug } = await params;
  const filtrosUrl = (await searchParams) ?? {};

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
  const precosVitrineCategoria: PrecosVitrineNormalizados =
    await adaptarPrecosVitrine(products).catch((error) => {
      console.error("Erro ao adaptar precos da categoria", error);

      return {
        precosPorChave: {},
        produtosPorId: {},
      };
    });

  // =================================================================
  // PASSO 3: Buscar subcategorias para as tabs
  // =================================================================
  const subcategoryTabs = await getSubcategoryTabs(category.id);
  const activeFiltersCount = 0;

  const [subcategoriasDiretas, categoriasIrmas] = await Promise.all([
    db.query.categoryTable.findMany({
      where: eq(categoryTable.parentId, category.id),
    }),
    category.parentId
      ? db.query.categoryTable.findMany({
          where: eq(categoryTable.parentId, category.parentId),
        })
      : Promise.resolve([]),
  ]);

  const categoriasFiltroBase =
    subcategoriasDiretas.length > 0
      ? subcategoriasDiretas
      : category.parentId
        ? categoriasIrmas.filter((item) => item.id !== category.id)
        : [];

  const categoriasFiltro: ItemFiltro[] = categoriasFiltroBase
    .map((cat) => {
      const count = products.filter(
        (produto) => produto.categoryId === cat.id,
      ).length;
      return { id: cat.id, name: cat.name, count };
    })
    .filter((item) => item.count > 0);

  const marcasMap = new Map<string, ItemFiltro>();
  const tamanhosMap = new Map<string, ItemFiltro>();
  const coresMap = new Map<string, ItemFiltro>();
  const precosEmCentavos: number[] = [];

  const obterPrecoProduto = (product: (typeof products)[number]) => {
    const precoVitrine =
      precosVitrineCategoria.produtosPorId[product.id]?.precoPrincipal;

    if (precoVitrine) {
      return precoVitrine.precoFinalEmCentavos;
    }

    const mainPricing = product.pricing?.find((p) => p.mainCardPrice === true);
    const variantPrices = (product.variants || [])
      .filter((variant) => variant.isActive && variant.priceInCents > 0)
      .map((variant) => variant.priceInCents);

    return product.productKind === "variable" && variantPrices.length > 0
      ? Math.min(...variantPrices)
      : mainPricing?.hasPromo
        ? mainPricing.promoPrice || 0
        : mainPricing?.price || 0;
  };

  products.forEach((produto) => {
    if (produto.brand?.trim()) {
      const chave = produto.brand.trim().toLowerCase();
      const atual = marcasMap.get(chave);
      marcasMap.set(chave, {
        id: chave,
        name: produto.brand.trim(),
        count: (atual?.count ?? 0) + 1,
      });
    }

    const precoFinalProduto = obterPrecoProduto(produto);
    if (precoFinalProduto > 0) {
      precosEmCentavos.push(precoFinalProduto);
    }

    produto.variants.forEach((variant) => {
      const atributos = variant.attributes || {};
      Object.entries(atributos).forEach(([chave, valor]) => {
        if (!valor?.trim()) return;

        const chaveNormalizada = chave.toLowerCase();
        const valorNormalizado = valor.trim();
        const id = valorNormalizado.toLowerCase();

        if (["tamanho", "size"].includes(chaveNormalizada)) {
          const atual = tamanhosMap.get(id);
          tamanhosMap.set(id, {
            id,
            name: valorNormalizado,
            count: (atual?.count ?? 0) + 1,
          });
        }

        if (["cor", "color", "colour"].includes(chaveNormalizada)) {
          const atual = coresMap.get(id);
          coresMap.set(id, {
            id,
            name: valorNormalizado,
            count: (atual?.count ?? 0) + 1,
          });
        }
      });
    });
  });

  function calcularFaixaPrecoComMargem(precos: number[]) {
    if (precos.length === 0) return [0, 1000] as const;

    const menorReal = Math.min(...precos);
    const maiorReal = Math.max(...precos);
    const passo = 1000; // R$ 10,00 em centavos

    const minimo = Math.floor(menorReal / passo) * passo;
    let maximo = Math.ceil(maiorReal / passo) * passo;

    if (maximo <= minimo) maximo = minimo + passo;

    return [minimo, maximo] as const;
  }

  const [precoMin, precoMax] = calcularFaixaPrecoComMargem(precosEmCentavos);

  const parseLista = (valor: string | string[] | undefined) => {
    if (!valor) return [];
    if (Array.isArray(valor))
      return valor
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean);
    return valor
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };
  const parseNumero = (valor: string | string[] | undefined) => {
    const bruto = Array.isArray(valor) ? valor[0] : valor;
    if (bruto === undefined || bruto === null) return null;
    const limpo = String(bruto).trim();
    if (!limpo) return null;
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : null;
  };

  const categoriasSelecionadas = new Set(parseLista(filtrosUrl.categories));
  const marcasSelecionadas = new Set(
    parseLista(filtrosUrl.brands).map((item) => item.toLowerCase()),
  );
  const tamanhosSelecionados = new Set(
    parseLista(filtrosUrl.sizes).map((item) => item.toLowerCase()),
  );
  const coresSelecionadas = new Set(
    parseLista(filtrosUrl.colors).map((item) => item.toLowerCase()),
  );
  const ratingSelecionadoBruto = Array.isArray(filtrosUrl.rating)
    ? filtrosUrl.rating[0]
    : filtrosUrl.rating;
  const ratingSelecionado = ratingSelecionadoBruto?.trim()
    ? ratingSelecionadoBruto
    : "all";
  const precoMinSelecionado = parseNumero(filtrosUrl.minPrice);
  const precoMaxSelecionado = parseNumero(filtrosUrl.maxPrice);

  const minAplicado = precoMinSelecionado ?? precoMin;
  const maxAplicado = precoMaxSelecionado ?? precoMax;
  const faixaPrecoAtiva =
    precoMinSelecionado !== null || precoMaxSelecionado !== null;
  const temFiltroAtivo =
    categoriasSelecionadas.size > 0 ||
    marcasSelecionadas.size > 0 ||
    tamanhosSelecionados.size > 0 ||
    coresSelecionadas.size > 0 ||
    (ratingSelecionado && ratingSelecionado !== "all") ||
    faixaPrecoAtiva;

  const productsFiltrados = !temFiltroAtivo
    ? products
    : products.filter((product) => {
        if (
          categoriasSelecionadas.size > 0 &&
          !categoriasSelecionadas.has(product.categoryId)
        ) {
          return false;
        }

        const marca = product.brand?.trim().toLowerCase();
        if (
          marcasSelecionadas.size > 0 &&
          (!marca || !marcasSelecionadas.has(marca))
        ) {
          return false;
        }

        if (tamanhosSelecionados.size > 0) {
          const possuiTamanho = product.variants.some((variant) =>
            Object.entries(variant.attributes || {}).some(
              ([chave, valor]) =>
                ["tamanho", "size"].includes(chave.toLowerCase()) &&
                tamanhosSelecionados.has(String(valor).trim().toLowerCase()),
            ),
          );
          if (!possuiTamanho) return false;
        }

        if (coresSelecionadas.size > 0) {
          const possuiCor = product.variants.some((variant) =>
            Object.entries(variant.attributes || {}).some(
              ([chave, valor]) =>
                ["cor", "color", "colour"].includes(chave.toLowerCase()) &&
                coresSelecionadas.has(String(valor).trim().toLowerCase()),
            ),
          );
          if (!possuiCor) return false;
        }

        if (faixaPrecoAtiva) {
          const precoProduto = obterPrecoProduto(product);
          if (precoProduto < minAplicado || precoProduto > maxAplicado) {
            return false;
          }
        }

        // Mantém visual de avaliação sem inventar nota: sem dados reais, não restringe.
        if (ratingSelecionado && ratingSelecionado !== "all") {
          return true;
        }

        return true;
      });

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
              <CategoryFilter
                dados={{
                  categories: categoriasFiltro,
                  brands: Array.from(marcasMap.values()),
                  sizes: Array.from(tamanhosMap.values()),
                  colors: Array.from(coresMap.values()),
                  priceRange: [precoMin, precoMax],
                }}
              />
            </div>
          </aside>

          {/* ========================================================= */}
          {/* CONTEÚDO PRINCIPAL */}
          {/* ========================================================= */}
          <main className="flex-1">
            {/* Mobile: Drawer para filtro */}
            <div className="mb-6 lg:hidden">
              <MobileFilterDrawer
                activeFiltersCount={activeFiltersCount}
                dadosFiltro={{
                  categories: categoriasFiltro,
                  brands: Array.from(marcasMap.values()),
                  sizes: Array.from(tamanhosMap.values()),
                  colors: Array.from(coresMap.values()),
                  priceRange: [precoMin, precoMax],
                }}
              />
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
            {productsFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {productsFiltrados.map((product) => {
                  // ===================================================
                  // 1. PEGAR IMAGEM PRINCIPAL DA GALERIA
                  // ===================================================
                  const primaryImage =
                    product.galleryImages?.find((img) => img.isPrimary) ||
                    product.galleryImages?.[0] ||
                    product.variants?.find((variant) => variant.imageUrl);

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
                  const precoVitrine =
                    precosVitrineCategoria.produtosPorId[product.id]
                      ?.precoPrincipal;

                  // PREÇO ATUAL (se tiver promoção, usa o promocional, senão usa o normal)
                  const variantPrices = (product.variants || [])
                    .filter(
                      (variant) => variant.isActive && variant.priceInCents > 0,
                    )
                    .map((variant) => variant.priceInCents);
                  const productPrice =
                    precoVitrine?.precoFinalEmCentavos ??
                    (product.productKind === "variable" &&
                    variantPrices.length > 0
                      ? Math.min(...variantPrices)
                      : mainPricing?.hasPromo
                        ? mainPricing.promoPrice
                        : mainPricing?.price || 0);

                  // PREÇO ORIGINAL (só existe se tiver promoção - para mostrar riscado)
                  const originalPrice = precoVitrine?.possuiPromocao
                    ? precoVitrine.precoOriginalEmCentavos
                    : mainPricing?.hasPromo
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
                      fromPrice={product.productKind === "variable"}
                      originalPrice={originalPrice} // Se tiver promoção, mostra preço original riscado
                      discount={precoVitrine?.percentualOff}
                      economyInCents={precoVitrine?.economiaEmCentavos}
                      badgePromocional={precoVitrine?.badgePromocional}
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
