"use client";

import type { ReactNode } from "react";

import { LayoutProdutoAprovado } from "../layout-produto-aprovado";
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
    <LayoutProdutoAprovado
      modoPreVisualizacao
      nomeProduto={nomeProduto}
      breadcrumbCategorias={breadcrumbCategorias}
      galeria={galeria}
      informacoes={informacoes}
      caixaCompra={caixaCompra}
      abas={abas}
      modalPagamento={modalPagamento}
      conteudoAposProduto={
        <>
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
        </>
      }
    />
  );
}
