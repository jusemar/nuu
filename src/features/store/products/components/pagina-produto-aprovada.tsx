"use client";

import type { ReactNode } from "react";

import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { Footer } from "@/components/common/footer";
import { CampoMensagemAtendente } from "@/features/atendimento-ia";
import { Header } from "@/features/header";

import type { ProdutoRelacionadoPdp } from "../queries/buscar-produtos-relacionados-pdp";
import { ProdutosRelacionadosPrevisualizacao } from "./pre-visualizacao/produtos-relacionados-previsualizacao";
import {
  BannerInstitucionalPrevisualizacao,
  CardAssistenteVirtualPrevisualizacao,
  SecaoCompreJuntoPrevisualizacao,
} from "./pre-visualizacao/secoes-demonstrativas-previsualizacao";

type PropriedadesPaginaProdutoAprovada = {
  produtoId: string;
  produtoSlug: string;
  nomeProduto: string;
  imagemProduto?: string;
  breadcrumbCategorias: Array<{ id: string; name: string; slug: string }>;
  galeria: ReactNode;
  mensagemPromocional?: ReactNode;
  demaisInformacoesCompra: ReactNode;
  descricaoCurta: ReactNode;
  informacoes: ReactNode;
  caixaCompra: ReactNode;
  abas: ReactNode;
  modalPagamento: ReactNode;
  produtosRelacionados?: ProdutoRelacionadoPdp[];
  /** Mantém os marcadores exclusivos do laboratório fora da PDP pública. */
  modoPreVisualizacao?: boolean;
};

/**
 * Composição visual aprovada para a PDP. Recebe apenas blocos já resolvidos
 * pelo orquestrador; preço, estoque, frete, carrinho e checkout continuam em
 * seus respectivos domínios.
 */
export function PaginaProdutoAprovada({
  produtoId,
  produtoSlug,
  nomeProduto,
  imagemProduto,
  breadcrumbCategorias,
  galeria,
  mensagemPromocional,
  demaisInformacoesCompra,
  descricaoCurta,
  informacoes,
  caixaCompra,
  abas,
  modalPagamento,
  produtosRelacionados = [],
  modoPreVisualizacao = false,
}: PropriedadesPaginaProdutoAprovada) {
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
          <div className="flex min-w-0 flex-col gap-5 min-[800px]:col-span-5">
            {galeria}
            {mensagemPromocional}
            {modoPreVisualizacao ? (
              <CardAssistenteVirtualPrevisualizacao
                nomeProduto={nomeProduto}
                modoPreVisualizacao
              />
            ) : (
              <CampoMensagemAtendente
                titulo="Como posso ajudar?"
                placeholder="Faça uma pergunta sobre este produto"
                apoio="Ex.: compatibilidade, prazo de entrega ou características"
                contexto={{
                  tipo: "produto",
                  produto: {
                    id: produtoId,
                    slug: produtoSlug,
                    nome: nomeProduto,
                  },
                }}
              />
            )}
            {demaisInformacoesCompra}
            {descricaoCurta}
          </div>

          <div className="flex min-w-0 flex-col gap-5 min-[800px]:col-span-7 lg:gap-6">
            {informacoes}
            {caixaCompra}
          </div>
        </section>

        <div className="mt-10 md:mt-14">
          <SecaoCompreJuntoPrevisualizacao
            nomeProduto={nomeProduto}
            imagemProduto={imagemProduto}
          />
          <BannerInstitucionalPrevisualizacao />
          <ProdutosRelacionadosPrevisualizacao
            produtos={produtosRelacionados}
          />
          <section className="mt-10 md:mt-14 [&>div>div:first-child]:gap-x-3 sm:[&>div>div:first-child]:gap-x-7">
            {abas}
          </section>
        </div>
      </main>

      <Footer />
      {modalPagamento}
    </div>
  );
}
