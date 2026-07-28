"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CategoryProductCard } from "@/features/store/category/components/CategoryProductCard";

import type { ProdutoRelacionadoPdp } from "../../queries/buscar-produtos-relacionados-pdp";

/**
 * Carrossel exclusivo do laboratório visual. Reutiliza o trilho Embla e as
 * setas de Ofertas Especiais, mas preserva os cards e a lista real da PDP.
 */
export function ProdutosRelacionadosPrevisualizacao({
  produtos,
}: {
  produtos: ProdutoRelacionadoPdp[];
}) {
  const produtosVisiveis = produtos.slice(0, 5);

  if (produtosVisiveis.length === 0) return null;

  return (
    <section
      aria-labelledby="titulo-produtos-relacionados-preview"
      className="mt-10 min-w-0 md:mt-14"
    >
      <div className="mb-5 flex items-center gap-3">
        <h2
          id="titulo-produtos-relacionados-preview"
          className="text-text-primary text-lg font-bold"
        >
          Você também pode gostar
        </h2>
        <div className="bg-surface-border h-px flex-1" />
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-2">
          {produtosVisiveis.map((produto) => (
            <CarouselItem
              key={produto.id}
              className="basis-[218px] pl-2 sm:basis-[232px]"
            >
              <div className="px-1 pb-1">
                <CategoryProductCard
                  id={produto.id}
                  name={produto.nome}
                  slug={produto.slug}
                  imageUrl={produto.imagemUrl}
                  price={produto.precoEmCentavos}
                  originalPrice={produto.precoOriginalEmCentavos}
                  discount={produto.percentualOff ?? undefined}
                  fromPrice={produto.produtoVariavel}
                  isFeatured={produto.destaque}
                  hasFreeShipping={produto.freteGratis}
                  hasFlashSale={produto.ofertaRelampago}
                  hasBestPrice={produto.melhorPreco}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-border bg-card text-primary hover:bg-primary-light -left-2 shadow-sm" />
        <CarouselNext className="border-border bg-card text-primary hover:bg-primary-light -right-2 shadow-sm" />
      </Carousel>
    </section>
  );
}
