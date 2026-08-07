"use client";

import { alterarTriagemProdutosStagingFornecedorAction } from "../../actions/alterar-triagem-produtos-staging-fornecedor";
import { confirmarItensVinculacaoFornecedorAction } from "../../actions/confirmar-itens-vinculacao-fornecedor";
import { removerRascunhoProdutoImportacaoFornecedor } from "../../actions/remover-rascunho-produto-importacao-fornecedor";
import { salvarRascunhoProdutoImportacaoFornecedor } from "../../actions/salvar-rascunho-produto-importacao-fornecedor";
import { vincularProdutoFornecedor } from "../../actions/vincular-produto-fornecedor";
import { extrairConfiguracaoComercialRascunhoFornecedor } from "../../lib/conciliacao/configuracao-rascunho-fornecedor";
import type { RascunhoImportacaoFornecedor } from "../../queries/listar-rascunhos-importacao-fornecedor";
import type { ProdutoParaVinculoFornecedor } from "../../types/fornecedores.types";
import type { ValoresPadraoRascunhoProdutoFornecedor } from "../../types/mapeamento-fornecedor.types";
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
  configuracaoFluxoJson: Record<string, unknown>;
  rascunhos: RascunhoImportacaoFornecedor[];
};

function possuiProdutoRealVinculado(linha: LinhaVinculacaoFornecedor) {
  return Boolean(linha.produtoLocalizadoId && linha.produtoVinculadoNome);
}

function obterStatusVisual(
  linha: LinhaVinculacaoFornecedor,
): ItemVinculoFornecedor["status"] {
  if (linha.status === "erro" || linha.status === "rejeitado") return "erro";
  if (linha.status === "ignorado") return "ignorado";
  if (linha.criterioLocalizacao === "novo_produto_fornecedor") return "novo";
  if (possuiProdutoRealVinculado(linha)) return "vinculado";

  return "aguardando";
}

function lerCampoBruto(
  linha: LinhaVinculacaoFornecedor,
  chaves: string[],
): string | null {
  const entradas = Object.entries(linha.dadosBrutos ?? {});
  const normalizar = (valor: string) =>
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  for (const chave of chaves) {
    const procurada = normalizar(chave);
    const encontrada = entradas.find(
      ([nome, valor]) =>
        normalizar(nome) === procurada &&
        valor !== null &&
        valor !== undefined &&
        String(valor).trim(),
    );

    if (encontrada) return String(encontrada[1]);
  }

  return null;
}

function montarItensVinculacaoArquivo(
  linhas: LinhaVinculacaoFornecedor[],
  rascunhos: RascunhoImportacaoFornecedor[],
): ItemVinculoFornecedor[] {
  const rascunhosPorStaging = new Map(
    rascunhos.flatMap((rascunho) =>
      rascunho.stagingId ? [[rascunho.stagingId, rascunho] as const] : [],
    ),
  );

  return linhas.map((linha) => {
    const rascunho = rascunhosPorStaging.get(linha.id);

    return {
      id: linha.id,
      produtoRecebido: {
        nome: linha.nomeProduto,
        codigo: linha.codigoFornecedor,
        ean: lerCampoBruto(linha, ["ean", "gtin", "codigo_ean", "cd_ean"]),
        ncm: lerCampoBruto(linha, ["ncm", "codigo_ncm"]),
        preco: linha.precoFornecedor,
        estoque: linha.estoqueFornecedor,
        pesoBruto: lerCampoBruto(linha, ["peso_bruto", "peso", "peso kg"]),
        alturaCaixa: lerCampoBruto(linha, ["altura_caixa", "altura"]),
        larguraCaixa: lerCampoBruto(linha, ["largura_caixa", "largura"]),
        comprimentoCaixa: lerCampoBruto(linha, [
          "comprimento_caixa",
          "comprimento",
        ]),
        complemento: [
          linha.categoriaFornecedor ?? "sem categoria",
          linha.marcaFornecedor ?? "sem marca",
        ].join(" · "),
      },
      status: rascunho ? "rascunho" : obterStatusVisual(linha),
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
      rascunhoSalvo: rascunho
        ? {
            id: rascunho.id,
            nome: rascunho.nome,
            categoriaNome: rascunho.categoriaNome,
            marcaNome: rascunho.marcaNome,
            precoLoja: rascunho.precoLoja,
          }
        : null,
      podeVincular: linha.status !== "erro" && linha.status !== "rejeitado",
      podeMarcarNovo:
        !possuiProdutoRealVinculado(linha) &&
        linha.status !== "erro" &&
        linha.status !== "rejeitado",
    };
  });
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function obterRegraValorPadrao(
  configuracao: Record<string, unknown>,
  campoDestino: string,
) {
  const regras = Array.isArray(configuracao.regras) ? configuracao.regras : [];
  const regra = regras.find(
    (item) =>
      ehRegistro(item) &&
      item.campoDestino === campoDestino &&
      item.estrategia === "valor_padrao_todos",
  );

  if (!ehRegistro(regra)) return {};

  return {
    id: typeof regra.valorPadraoId === "string" ? regra.valorPadraoId : "",
    nome:
      typeof regra.valorPadraoLabel === "string" ? regra.valorPadraoLabel : "",
  };
}

function montarValoresPadraoNovoProduto(
  configuracao: Record<string, unknown>,
): ValoresPadraoRascunhoProdutoFornecedor {
  const categoria = obterRegraValorPadrao(configuracao, "categoria_fornecedor");
  const marca = obterRegraValorPadrao(configuracao, "marca_fornecedor");
  const comercial =
    extrairConfiguracaoComercialRascunhoFornecedor(configuracao);

  return {
    categoriaId: categoria.id || undefined,
    categoriaNome: categoria.nome || undefined,
    marcaId: marca.id || undefined,
    marcaNome: marca.nome || undefined,
    configuracaoComercial: comercial.modalidade
      ? {
          modalidade: comercial.modalidade,
          prazoEntrega: comercial.prazoEntrega,
        }
      : undefined,
  };
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
  configuracaoFluxoJson,
  rascunhos,
}: AbaVinculacaoImportacaoFornecedorProps) {
  const itens = montarItensVinculacaoArquivo(linhas, rascunhos);
  const produtosDaLoja = montarProdutosDaLoja(produtosParaVinculo);
  const valoresPadraoNovoProduto = montarValoresPadraoNovoProduto(
    configuracaoFluxoJson,
  );
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
        totalRascunhosPersistidosInicial={rascunhos.length}
        valoresPadraoNovoProduto={valoresPadraoNovoProduto}
        aoSalvarRascunhoPersistido={salvarRascunhoProdutoImportacaoFornecedor}
        aoRemoverRascunhoPersistido={({ rascunhoId }) =>
          removerRascunhoProdutoImportacaoFornecedor({
            rascunhoId,
            importacaoId,
          })
        }
        aoAlterarTriagemPersistida={({ itemIds, acao }) =>
          alterarTriagemProdutosStagingFornecedorAction({
            importacaoId,
            stagingIds: itemIds,
            acao,
          })
        }
        aoContinuarSelecionados={(stagingIds) =>
          confirmarItensVinculacaoFornecedorAction({
            importacaoId,
            stagingIds,
          })
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
        Página {paginacao.pagina} de {paginacao.totalPaginas} ·{" "}
        {paginacao.total} itens
      </div>
    </section>
  );
}
