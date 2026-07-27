import { CategoryProductCard } from "@/features/store/category/components/CategoryProductCard";

import type { ProdutoRelacionadoPdp } from "../../queries/buscar-produtos-relacionados-pdp";

export function ProdutosRelacionadosPdp({
  produtos,
}: {
  produtos: ProdutoRelacionadoPdp[];
}) {
  if (produtos.length < 2) return null;

  return (
    <section aria-labelledby="titulo-produtos-relacionados" className="mt-16">
      <div className="mb-5 flex items-center gap-3">
        <h2
          id="titulo-produtos-relacionados"
          className="text-text-primary text-lg font-bold"
        >
          Você também pode gostar
        </h2>
        <div className="bg-surface-border h-px flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {produtos.map((produto) => (
          <CategoryProductCard
            key={produto.id}
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
        ))}
      </div>
    </section>
  );
}
