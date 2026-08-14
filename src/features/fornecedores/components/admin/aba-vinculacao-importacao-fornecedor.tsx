"use client";

import Link from "next/link";

import { PaginacaoAdmin } from "@/components/shared/paginacao-admin";
import { OPCOES_LIMITE_FORNECEDORES } from "@/features/fornecedores/lib/paginacao-fornecedores";

import { alterarTriagemProdutosStagingFornecedorAction } from "../../actions/alterar-triagem-produtos-staging-fornecedor";
import { confirmarItensVinculacaoFornecedorAction } from "../../actions/confirmar-itens-vinculacao-fornecedor";
import { removerRascunhoProdutoImportacaoFornecedor } from "../../actions/remover-rascunho-produto-importacao-fornecedor";
import { salvarRascunhoProdutoImportacaoFornecedor } from "../../actions/salvar-rascunho-produto-importacao-fornecedor";
import { vincularProdutoFornecedor } from "../../actions/vincular-produto-fornecedor";
import { extrairConfiguracaoComercialRascunhoFornecedor } from "../../lib/conciliacao/configuracao-rascunho-fornecedor";
import { derivarEstagioItemImportacaoFornecedor } from "../../lib/estagio-item-importacao-fornecedor";
import type { RascunhoImportacaoFornecedor } from "../../queries/listar-rascunhos-importacao-fornecedor";
import type { ContadoresEstagioVinculacaoFornecedor } from "../../queries/listar-staging-importacao-fornecedor-admin";
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
  /**
   * Estágio do item nesta importação, já derivado no banco pela mesma
   * expressão que alimenta os contadores. A tela não recalcula nada.
   */
  estagio?: string;
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
  estagio?: string;
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
  /** Totais da importação INTEIRA, não só da página aberta. */
  contadoresEstagio: ContadoresEstagioVinculacaoFornecedor;
};

function possuiProdutoRealVinculado(linha: LinhaVinculacaoFornecedor) {
  return Boolean(linha.produtoLocalizadoId && linha.produtoVinculadoNome);
}

/**
 * Traduz o estágio (vindo do banco) para o vocabulário visual da tabela, que
 * chama "aguardando" o que o domínio chama "pendente".
 *
 * O fallback só existe para linhas que cheguem sem o campo; a regra canônica
 * está em `lib/estagio-item-importacao-fornecedor`, testada.
 */
function obterStatusVisual(
  linha: LinhaVinculacaoFornecedor,
): ItemVinculoFornecedor["status"] {
  const estagio =
    linha.estagio ??
    derivarEstagioItemImportacaoFornecedor({
      statusStaging: linha.status,
      possuiProdutoVinculado: possuiProdutoRealVinculado(linha),
      marcadoComoNovo: false,
      publicadoNestaImportacao: false,
    });

  return estagio === "pendente"
    ? "aguardando"
    : (estagio as ItemVinculoFornecedor["status"]);
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
  contadoresEstagio,
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

  /**
   * Resumo da importação inteira.
   *
   * Os números dos filtros da tabela contam só as linhas carregadas na página
   * (25 de 685), então não respondem "como está esta importação". Este resumo
   * vem do banco e cobre todos os itens — e é aqui que "Publicado" aparece
   * separado de "Vinculado".
   */
  const resumoEstagios: Array<{
    chave: string;
    label: string;
    valor: number;
    classe: string;
    /** Estágio isolado por este chip no servidor. */
    estagio: string;
  }> = [
    {
      chave: "pendentes",
      label: "Pendentes",
      valor: contadoresEstagio.pendentes,
      classe: "border-amber-200 bg-amber-50 text-amber-800",
      estagio: "pendente",
    },
    {
      chave: "vinculados",
      label: "Vinculados",
      valor: contadoresEstagio.vinculados,
      classe: "border-emerald-200 bg-emerald-50 text-emerald-700",
      estagio: "vinculado",
    },
    {
      chave: "conciliacao",
      label: "Em Conciliação",
      valor: contadoresEstagio.conciliacao,
      classe: "border-cyan-200 bg-cyan-50 text-cyan-800",
      estagio: "conciliacao",
    },
    {
      chave: "novos",
      label: "Novos",
      valor: contadoresEstagio.novos,
      classe: "border-blue-200 bg-blue-50 text-blue-700",
      estagio: "novo",
    },
    {
      chave: "publicados",
      label: "Publicados",
      valor: contadoresEstagio.publicados,
      classe: "border-violet-200 bg-violet-50 text-violet-700",
      estagio: "publicado",
    },
    {
      chave: "ignorados",
      label: "Ignorados",
      valor: contadoresEstagio.ignorados,
      classe: "border-slate-200 bg-slate-100 text-slate-600",
      estagio: "ignorado",
    },
    {
      chave: "erros",
      label: "Erros",
      valor: contadoresEstagio.erros,
      estagio: "erro",
      classe: "border-red-200 bg-red-50 text-red-700",
    },
  ];

  /**
   * Endereço de um estágio. Trocar de filtro sempre volta para a página 1 —
   * continuar na página 12 depois de filtrar deixaria a tela vazia sem
   * explicação.
   */
  function hrefEstagio(estagio?: string) {
    return montarHrefVinculacao({ estagio: estagio ?? "", pagina: 1 });
  }

  /** Preserva TODOS os filtros ativos ao mudar de página ou de limite. */
  function montarHrefVinculacao(mudancas: {
    pagina?: number;
    limite?: number;
    estagio?: string;
  }) {
    const parametros = new URLSearchParams();
    const dados: Record<string, string | number | undefined> = {
      etapa: "vinculacao",
      busca: filtros.busca,
      codigoFornecedor: filtros.codigoFornecedor,
      categoriaFornecedor: filtros.categoriaFornecedor,
      marcaFornecedor: filtros.marcaFornecedor,
      status: filtros.status,
      estagio: filtros.estagio,
      pagina: filtros.pagina,
      limite: filtros.limite,
      ...mudancas,
    };

    Object.entries(dados).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== "") {
        parametros.set(chave, String(valor));
      }
    });

    return `/admin/fornecedores/importacoes/${importacaoId}?${parametros.toString()}`;
  }

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm font-semibold text-slate-950">
            {contadoresEstagio.todos} itens nesta importação
          </span>
          {resumoEstagios.map((estagio) => (
            <Link
              key={estagio.chave}
              href={hrefEstagio(estagio.estagio)}
              aria-current={
                filtros.estagio === estagio.estagio ? "true" : undefined
              }
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:brightness-95 ${estagio.classe} ${
                filtros.estagio === estagio.estagio
                  ? "ring-2 ring-slate-900 ring-offset-1"
                  : ""
              }`}
            >
              {estagio.valor} {estagio.label}
            </Link>
          ))}
          {filtros.estagio ? (
            <Link
              href={hrefEstagio()}
              className="text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-950"
            >
              limpar filtro
            </Link>
          ) : null}
        </div>
      </div>

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

      {/*
        A barra que faltava. A consulta já paginava em 25, mas a tela só
        imprimia "Página 1 de 28" como texto — não havia como chegar à página 2.
      */}
      <PaginacaoAdmin
        pagina={paginacao.pagina}
        totalPaginas={paginacao.totalPaginas}
        total={paginacao.total}
        limite={paginacao.limite}
        opcoesLimite={OPCOES_LIMITE_FORNECEDORES}
        montarHref={montarHrefVinculacao}
        rotuloItens="produtos"
      />
    </section>
  );
}
