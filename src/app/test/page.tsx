"use client";

import { useEffect, useState } from "react";

import DealsCarousel from "@/features/deals/components/DealsCarousel";
import { ProductCard } from "@/features/product-card/components/ProductCard";
import ProductCarousel from "@/features/product-carousel/components/RotatingProductCarousel";
import { getProductsByFlag } from "@/features/products/actions/get-products-by-flag";

import FeaturedProductCard from "./FeaturedProductCard/page";

type ProdutoPorFlag = Awaited<ReturnType<typeof getProductsByFlag>>[number];

export default function TestPage() {
  const [testProducts, setTestProducts] = useState<ProdutoPorFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Testar a action getProductsByFlag
  useEffect(() => {
    async function testAction() {
      setIsLoading(true);
      try {
        const products = await getProductsByFlag(["general"]);
        setTestProducts(products);

        // LOG AQUI DENTRO
        console.log(
          "DEBUG mainPrice do primeiro produto:",
          products[0]?.mainPrice,
        );

        console.log("DEBUG todos produtos:", products);
      } catch (error) {
        console.error("Erro ao testar action:", error);
      } finally {
        setIsLoading(false);
      }
    }

    testAction();
  }, []);

  // Novo estado para produtos com flag 'sale'
  const [saleProducts, setSaleProducts] = useState<ProdutoPorFlag[]>([]);
  const [isLoadingSale, setIsLoadingSale] = useState(true);

  // Buscar produtos com flag 'sale'
  useEffect(() => {
    async function loadSaleProducts() {
      setIsLoadingSale(true);
      try {
        const products = await getProductsByFlag(["sale"]);
        setSaleProducts(products);
      } catch (error) {
        console.error("Erro ao buscar produtos em oferta:", error);
      } finally {
        setIsLoadingSale(false);
      }
    }

    loadSaleProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* PARTE ORIGINAL (mantida) */}
      <ProductCarousel />

      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ProductCard
          id="prod-001"
          image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
          title="Fones de Ouvido Premium Noise Cancelling"
          description="Cancelamento ativo de ruído, bateria 30h, Bluetooth 5.3, som surround"
          originalPrice={299.99}
          currentPrice={199.99}
          discount={33}
          hasFreeShipping={true}
          hasFlashSale={true}
          hasBestPrice={true}
          isFavorite={false}
          onToggleFavorite={(id) => console.log("Favorito:", id)}
          onAddToCart={(id) => console.log("Carrinho:", id)}
          className="mx-auto"
        />
        <FeaturedProductCard
          id="featured-001"
          image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
          title="Fones de Ouvido Premium Noise Cancelling"
          description="Cancelamento ativo de ruído, bateria 30h, Bluetooth 5.3, som surround"
          originalPrice={299.99}
          currentPrice={199.99}
          discount={33}
          hasFreeShipping={true}
          isFeatured={true}
          isExclusive={false}
          isTrending={false}
          rating={4.8}
          reviewCount={128}
          isFavorite={false}
          onToggleFavorite={(id) => console.log("Favorito:", id)}
          onAddToCart={(id) => console.log("Carrinho:", id)}
        />
      </div>

      {/* SEÇÃO DE TESTE DA ACTION - NOVA */}
      <div className="mx-auto mt-12 max-w-7xl border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">🔍 Teste: getProductsByFlag</h2>

        {isLoading ? (
          <p className="text-gray-500">
            Carregando produtos com flag {`"general"`}...
          </p>
        ) : testProducts.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="font-medium text-yellow-800">
              ⚠️ Nenhum produto encontrado com flag {`"general"`}
            </p>
            <p className="mt-1 text-sm text-yellow-600">
              Verifique se existem produtos com <code>storeProductFlags</code>{" "}
              contendo {`"general"`}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">
              ✅ {testProducts.length} produto(s) encontrado(s)
            </p>

            <div className="mt-4 space-y-3">
              {testProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="rounded border bg-white p-3">
                  <p>
                    <strong>Nome:</strong> {product.name}
                  </p>
                  <p>
                    <strong>Flags:</strong>{" "}
                    {JSON.stringify(product.storeProductFlags)}
                  </p>
                  <p>
                    <strong>card_short_text:</strong>{" "}
                    {product.cardShortText || "(vazio)"}
                  </p>

                  {/* NOVAS LINHAS PARA PREÇO */}
                  <p>
                    <strong>Preço principal:</strong>
                    {product.mainPrice
                      ? `R$ ${(product.mainPrice.price / 100).toFixed(2)}`
                      : "(sem preço)"}
                  </p>

                  {product.mainPrice?.hasPromo &&
                    product.mainPrice.promoPrice && (
                      <p>
                        <strong>Preço promocional:</strong>
                        R$ {(product.mainPrice.promoPrice / 100).toFixed(2)}
                      </p>
                    )}

                  <p>
                    <strong>Variants:</strong> {product.variants?.length || 0}
                  </p>
                </div>
              ))}
            </div>

            {testProducts.length > 3 && (
              <p className="mt-2 text-sm text-gray-600">
                ... e mais {testProducts.length - 3} produtos
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">
          🎯 Teste: DealsCarousel (UI)
        </h2>
        <DealsCarousel />
      </div>

      {/* Seção com dados REAIS da flag 'sale' */}
      <div className="mt-12 border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">
          🔥 DealsCarousel com dados REAIS (flag {`'sale'`})
        </h2>

        {isLoadingSale ? (
          <p className="text-gray-500">Carregando produtos em oferta...</p>
        ) : saleProducts.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="font-medium text-yellow-800">
              ⚠️ Nenhum produto com flag {`"sale"`}
            </p>
            <p className="mt-1 text-sm text-yellow-600">
              Adicione a flag {`"sale"`} no campo storeProductFlags de alguns
              produtos
            </p>
          </div>
        ) : (
          <DealsCarousel
            products={saleProducts.map((p) => {
              const priceNormal = p.mainPrice?.price
                ? p.mainPrice.price / 100
                : 0;
              const pricePromo = p.mainPrice?.promoPrice
                ? p.mainPrice.promoPrice / 100
                : null;
              const hasPromo = p.mainPrice?.hasPromo === true && pricePromo !== null;
              const discount =
                hasPromo && priceNormal > 0
                  ? Math.round(((priceNormal - pricePromo) / priceNormal) * 100)
                  : undefined;

              return {
                id: p.id,
                image: p.mainImage?.imageUrl || "/produto-sem-foto.webp",
                title: p.name,
                description: p.cardShortText ?? undefined,
                currentPrice: hasPromo && pricePromo !== null ? pricePromo : priceNormal,
                originalPrice: hasPromo ? priceNormal : undefined,
                discount: discount,
                hasFreeShipping: p.hasFreeShipping ?? false,
                hasFlashSale: hasPromo,
                hasBestPrice: false,
              };
            })}
          />
        )}
      </div>
    </div>
  );
}
