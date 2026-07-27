"use client";

import type { ReactNode } from "react";

import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { Footer } from "@/components/common/footer";
import { Header } from "@/features/header";

type PropriedadesLayoutProdutoAprovado = {
  nomeProduto: string;
  breadcrumbCategorias: Array<{ id: string; name: string; slug: string }>;
  galeria: ReactNode;
  informacoes: ReactNode;
  caixaCompra: ReactNode;
  abas: ReactNode;
  modalPagamento: ReactNode;
  conteudoAposProduto?: ReactNode;
  modoPreVisualizacao?: boolean;
};

/**
 * Estrutura visual comum da PDP. Os componentes recebidos continuam sendo os
 * responsáveis por dados, precificação, estoque, frete e carrinho.
 */
export function LayoutProdutoAprovado({
  nomeProduto,
  breadcrumbCategorias,
  galeria,
  informacoes,
  caixaCompra,
  abas,
  modalPagamento,
  conteudoAposProduto,
  modoPreVisualizacao = false,
}: PropriedadesLayoutProdutoAprovado) {
  return (
    <div
      data-modo-pdp-preview={modoPreVisualizacao ? "true" : undefined}
      className="bg-background text-foreground min-h-screen overflow-x-hidden"
    >
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="py-4">
          <CategoryBreadcrumb
            categories={breadcrumbCategorias}
            currentPage={nomeProduto}
            className="text-xs"
            currentPageClassName="text-primary font-semibold"
          />
        </div>

        <section className="grid grid-cols-1 gap-6 min-[800px]:grid-cols-12 min-[800px]:gap-5 lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6 min-[800px]:col-span-5 min-[800px]:gap-7 lg:gap-8">
            {galeria}
            <div className="hidden min-[800px]:block">{abas}</div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 min-[800px]:col-span-7 lg:gap-6">
            {informacoes}
            {caixaCompra}
          </div>
        </section>

        <section className="mt-8 min-[800px]:hidden">{abas}</section>
        {conteudoAposProduto}
      </main>

      <Footer />
      {modalPagamento}
    </div>
  );
}
