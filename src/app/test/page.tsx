// src/app/test/page.tsx
"use client";

import { ProductCard } from "@/features/product-card/components/ProductCard";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TestPage() {
  const { data: products = [], isLoading } = useSWR(
    "https://fakestoreapi.com/products?limit=12",
    fetcher
  );

  if (isLoading)
    return <div className="min-h-screen flex items-center justify-center text-2xl">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Minha Loja – Teste ao Vivo</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
  {products.map((p: any) => (
    <ProductCard
      key={p.id}
      product={{
        id: p.id,
        name: p.title,
        price: p.price * 5.7,
        discountPrice: Math.random() > 0.3 ? p.price * 5.7 * 0.78 : undefined,
        image: p.image,
        flashSale: Math.random() > 0.7,
        freeShipping: Math.random() > 0.4,
        bestPriceBrazil: Math.random() > 0.6,
        pixHighlight: true,
      }}
    />
  ))}
</div>
  
      </div>
    </div>
  );
}