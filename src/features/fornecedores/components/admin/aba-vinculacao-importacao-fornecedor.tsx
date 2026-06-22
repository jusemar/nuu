"use client";

import { vincularProdutoFornecedor } from "../../actions/vincular-produto-fornecedor";
import type { ProdutoParaVinculoFornecedor } from "../../types/fornecedores.types";
import {
  type ItemVinculoFornecedor,
  type ProdutoLojaParaVinculoFornecedor,
  TabelaVinculosFornecedor,
} from "./tabela-vinculos-fornecedor";

type LinhaVinculacaoFornecedor = {
  id: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  precoCalculado: string | null;
  origemAjuste: string;
  estoqueFornecedor: number | null;
  produtoLocalizadoId: string | null;
  criterioLocalizacao: string | null;
  produtoVinculadoNome: string | null;
  produtoVinculadoSku: string | null;
  status: string;
  errosValidacao: Array<{ codigo: string; mensagem: string; campo?: string }>;
  dadosBrutos: Record<string, string | number | boolean | Date | null>;
};

type PaginacaoFornecedor = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

type FiltrosFornecedor = {
  etapa: string;
  busca?: string;
  codigoFornecedor?: string;
  categoriaFornecedor?: string;
  marcaFornecedor?: string;
  status?: string;
  vinculo?: string;
  pagina: number;
  limite: number;
  vincularStagingId?: string;
  buscaProduto?: string;
};

type AbaVinculacaoImportacaoFornecedorProps = {
  importacaoId: string;
  linhas: LinhaVinculacaoFornecedor[];
  paginacao: PaginacaoFornecedor;
  filtros: FiltrosFornecedor;
  produtosParaVinculo: ProdutoParaVinculoFornecedor[];
};

function possuiProdutoRealVinculado(linha: LinhaVinculacaoFornecedor) {
  return Boolean(linha.produtoLocalizadoId && linha.produtoVinculadoNome);
}

function obterStatusVisual(
  linha: LinhaVinculacaoFornecedor,
): ItemVinculoFornecedor["status"] {
  if (linha.status === "erro" || linha.status === "rejeitado") return "erro";
  if (linha.criterioLocalizacao === "novo_produto_fornecedor") return "novo";
  if (possuiProdutoRealVinculado(linha)) return "vinculado";

  return "aguardando";
}

function montarItensVinculacaoArquivo(
  linhas: LinhaVinculacaoFornecedor[],
): ItemVinculoFornecedor[] {
  return linhas.map((linha) => ({
    id: linha.id,
    produtoRecebido: {
      nome: linha.nomeProduto,
      codigo: linha.codigoFornecedor,
      preco: linha.precoFornecedor,
      estoque: linha.estoqueFornecedor,
      complemento: [
        linha.categoriaFornecedor ?? "sem categoria",
        linha.marcaFornecedor ?? "sem marca",
      ].join(" · "),
    },
    status: obterStatusVisual(linha),
    produtoLoja: possuiProdutoRealVinculado(linha)
      ? {
          id: linha.produtoLocalizadoId ?? "",
          nome: linha.produtoVinculadoNome ?? "",
          sku: linha.produtoVinculadoSku ?? "-",
          categoria: null,
          preco: linha.precoCalculado,
          jaVinculado: true,
        }
      : null,
    podeVincular: linha.status !== "erro" && linha.status !== "rejeitado",
    podeMarcarNovo:
      !possuiProdutoRealVinculado(linha) &&
      linha.status !== "erro" &&
      linha.status !== "rejeitado",
  }));
}

function montarProdutosDaLoja(
  produtos: ProdutoParaVinculoFornecedor[],
): ProdutoLojaParaVinculoFornecedor[] {
  return produtos.map((produto) => ({
    id: produto.id,
    nome: produto.nome,
    sku: produto.sku,
    categoria: produto.marca,
    preco: null,
    jaVinculado: false,
  }));
}

export function AbaVinculacaoImportacaoFornecedor({
  importacaoId,
  linhas,
  paginacao,
  filtros,
  produtosParaVinculo,
}: AbaVinculacaoImportacaoFornecedorProps) {
  const itens = montarItensVinculacaoArquivo(linhas);
  const produtosDaLoja = montarProdutosDaLoja(produtosParaVinculo);
  const parametrosProximaEtapa = new URLSearchParams({
    etapa: "revisao",
    pagina: String(filtros.pagina),
    limite: String(filtros.limite),
  });

  return (
    <section className="space-y-3">
      <TabelaVinculosFornecedor
        tipoOrigem="arquivo"
        titulo="Vinculação de produtos"
        subtitulo="Associe os produtos recebidos do arquivo aos produtos já existentes na loja."
        labelProdutoRecebido="Produto do arquivo"
        itens={itens}
        produtosDaLoja={produtosDaLoja}
        textoAcaoPrincipal="Continuar para conciliação"
        hrefAcaoPrincipal={`/admin/fornecedores/importacoes/${importacaoId}?${parametrosProximaEtapa.toString()}`}
        acaoVincular={vincularProdutoFornecedor}
      />

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
        Página {paginacao.pagina} de {paginacao.totalPaginas} ·{" "}
        {paginacao.total} itens
      </div>
    </section>
  );
}
