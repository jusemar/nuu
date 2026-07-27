"use client";

import type { ReactNode } from "react";

import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { Footer } from "@/components/common/footer";
import { Header } from "@/features/header";

import {
  BannerInstitucionalPrevisualizacao,
  SecaoCompreJuntoPrevisualizacao,
  SecoesDemonstrativasPrevisualizacao,
} from "./secoes-demonstrativas-previsualizacao";

type Props = {
  nomeProduto: string;
  imagemProduto?: string;
  breadcrumbCategorias: Array<{ id: string; name: string; slug: string }>;
  galeria: ReactNode;
  informacoes: ReactNode;
  caixaCompra: ReactNode;
  abas: ReactNode;
  modalPagamento: ReactNode;
  conteudoRelacionados?: ReactNode;
};

/**
 * Composição exclusivamente visual da rota de pré-visualização. Ela recebe
 * estado, handlers e preços já resolvidos pelo orquestrador da PDP, sem criar
 * uma segunda regra para venda, estoque, frete ou carrinho.
 */
export function PaginaProdutoPrevisualizacao({
  nomeProduto,
  imagemProduto,
  breadcrumbCategorias,
  galeria,
  informacoes,
  caixaCompra,
  abas,
  modalPagamento,
  conteudoRelacionados,
}: Props) {
  return (
    <div
      data-modo-pdp-preview="true"
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

        <section
          data-secao-preview="produto-principal"
          className="grid grid-cols-1 gap-6 min-[800px]:grid-cols-12 min-[800px]:gap-5 lg:gap-8"
        >
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

        <SecaoCompreJuntoPrevisualizacao
          nomeProduto={nomeProduto}
          imagemProduto={imagemProduto}
        />

        <BannerInstitucionalPrevisualizacao />

        {conteudoRelacionados ? (
          <div className="[&>section]:mt-10 md:[&>section]:mt-14">
            {conteudoRelacionados}
          </div>
        ) : null}

        <SecoesDemonstrativasPrevisualizacao nomeProduto={nomeProduto} />
      </main>

      <Footer />
      {modalPagamento}
    </div>
  );
}
