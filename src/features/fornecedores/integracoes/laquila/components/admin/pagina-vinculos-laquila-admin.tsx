"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  desfazerVinculoProdutoRecebidoFornecedor,
  salvarVinculoProdutoRecebidoFornecedor,
} from "@/features/fornecedores/actions";
import {
  type ItemVinculoFornecedor,
  type RascunhoVinculoFornecedor,
  TabelaVinculosFornecedor,
} from "@/features/fornecedores/components/admin/tabela-vinculos-fornecedor";
import type {
  ConfiguracaoComercialMapeamentoFornecedor,
  EstrategiaPrazoEntregaFornecedor,
  ModalidadeComercialFornecedor,
  ValoresPadraoRascunhoProdutoFornecedor,
} from "@/features/fornecedores/types/mapeamento-fornecedor.types";
import {
  buscarProdutosVinculoLaquila,
  removerRascunhoProdutoLaquila,
  salvarProdutosSelecionadosStagingLaquila,
  salvarRascunhoProdutoLaquila,
} from "@/features/fornecedores/integracoes/laquila/actions";
import {
  CHAVE_PRODUTOS_SELECIONADOS_MAPEAMENTO_LAQUILA,
  CHAVE_RASCUNHOS_CONCILIACAO_LAQUILA,
  CHAVE_REGRAS_MAPEAMENTO_LAQUILA,
} from "@/features/fornecedores/integracoes/laquila/constants";
import type {
  RascunhoConciliacaoLaquila,
  VinculoProdutoLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";

type ProdutoSelecionadoMapeamentoLaquila = {
  cd_item: string;
  descricao: string;
  cd_ean: string;
  NCM: string;
  ds_ggrupo: string;
  ds_grupo: string;
  ds_sgrupo: string;
  lista_fotos: unknown;
  vl_preco: string | number | null;
  qt_saldo: string | number | null;
  peso_bruto: string;
  altura_caixa: string;
  largura_caixa: string;
  comprimento_caixa: string;
};

type RegraMapeamentoLaquilaTemporaria = {
  campoDestino: string;
  estrategia: string;
  valorPadraoId?: string;
  valorPadraoLabel?: string;
  valorPadraoTexto?: string;
};

type RegraCategoriaCombinacaoLaquilaTemporaria = {
  estrategia: string;
  camposApi: string[];
  traducoes: Array<{
    chave: string;
    valores: string[];
    categoriaId?: string;
    categoriaLabel?: string;
  }>;
};

type RegrasMapeamentoLaquilaTemporarias = {
  origem?: string;
  regras?: RegraMapeamentoLaquilaTemporaria[];
  categoriaCombinacao?: RegraCategoriaCombinacaoLaquilaTemporaria;
  configuracaoComercial?: ConfiguracaoComercialMapeamentoFornecedor;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function obterTextoRegistro(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);

  return "";
}

function normalizarProdutoSelecionado(
  valor: unknown,
): ProdutoSelecionadoMapeamentoLaquila | null {
  if (!ehRegistro(valor)) return null;

  const cdItem = obterTextoRegistro(valor, "cd_item");

  if (!cdItem) return null;

  return {
    cd_item: cdItem,
    descricao: obterTextoRegistro(valor, "descricao"),
    cd_ean: obterTextoRegistro(valor, "cd_ean"),
    NCM: obterTextoRegistro(valor, "NCM"),
    ds_ggrupo: obterTextoRegistro(valor, "ds_ggrupo"),
    ds_grupo: obterTextoRegistro(valor, "ds_grupo"),
    ds_sgrupo: obterTextoRegistro(valor, "ds_sgrupo"),
    lista_fotos: valor.lista_fotos,
    vl_preco:
      typeof valor.vl_preco === "string" || typeof valor.vl_preco === "number"
        ? valor.vl_preco
        : null,
    qt_saldo:
      typeof valor.qt_saldo === "string" || typeof valor.qt_saldo === "number"
        ? valor.qt_saldo
        : null,
    peso_bruto: obterTextoRegistro(valor, "peso_bruto"),
    altura_caixa: obterTextoRegistro(valor, "altura_caixa"),
    largura_caixa: obterTextoRegistro(valor, "largura_caixa"),
    comprimento_caixa: obterTextoRegistro(valor, "comprimento_caixa"),
  };
}

function extrairImagens(valor: unknown) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  if (typeof valor !== "string") return [];

  return valor
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function converterEstoque(valor: string | number | null) {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string") return null;

  const numero = Number(valor.replace(",", "."));

  return Number.isFinite(numero) ? numero : null;
}

function converterItemVinculo(
  produto: ProdutoSelecionadoMapeamentoLaquila,
  rascunho?: RascunhoConciliacaoLaquila,
  vinculo?: VinculoProdutoLaquila,
): ItemVinculoFornecedor {
  return {
    id: `laquila-${produto.cd_item}`,
    produtoRecebido: {
      nome: produto.descricao || "Produto sem descrição",
      codigo: produto.cd_item,
      ean: produto.cd_ean || null,
      ncm: produto.NCM || null,
      preco:
        produto.vl_preco === null || produto.vl_preco === ""
          ? null
          : String(produto.vl_preco),
      estoque: converterEstoque(produto.qt_saldo),
      imagens: extrairImagens(produto.lista_fotos),
      pesoBruto: produto.peso_bruto || null,
      alturaCaixa: produto.altura_caixa || null,
      larguraCaixa: produto.largura_caixa || null,
      comprimentoCaixa: produto.comprimento_caixa || null,
      complemento: [produto.ds_ggrupo, produto.ds_grupo, produto.ds_sgrupo]
        .filter((parte) => parte.trim().length > 0)
        .join(" > "),
      camposOrigem: {
        ds_ggrupo: produto.ds_ggrupo,
        ds_grupo: produto.ds_grupo,
        ds_sgrupo: produto.ds_sgrupo,
      },
    },
    status: vinculo ? "vinculado" : rascunho ? "rascunho" : "aguardando",
    produtoLoja: vinculo
      ? { ...vinculo.produto, vinculoId: vinculo.vinculoId }
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
  };
}

function normalizarRegraMapeamentoLaquila(
  valor: unknown,
): RegraMapeamentoLaquilaTemporaria | null {
  if (!ehRegistro(valor)) return null;

  const campoDestino = obterTextoRegistro(valor, "campoDestino");
  const estrategia = obterTextoRegistro(valor, "estrategia");

  if (!campoDestino || !estrategia) return null;

  return {
    campoDestino,
    estrategia,
    valorPadraoId: obterTextoRegistro(valor, "valorPadraoId") || undefined,
    valorPadraoLabel:
      obterTextoRegistro(valor, "valorPadraoLabel") || undefined,
    valorPadraoTexto:
      obterTextoRegistro(valor, "valorPadraoTexto") || undefined,
  };
}

function normalizarRegrasMapeamentoLaquila(
  valor: unknown,
): RegrasMapeamentoLaquilaTemporarias {
  if (!ehRegistro(valor)) return {};

  const regras = Array.isArray(valor.regras)
    ? valor.regras
        .map(normalizarRegraMapeamentoLaquila)
        .filter((regra): regra is RegraMapeamentoLaquilaTemporaria =>
          Boolean(regra),
        )
    : [];
  const categoriaCombinacao = normalizarCategoriaCombinacaoLaquila(
    valor.categoriaCombinacao,
  );

  return {
    origem: obterTextoRegistro(valor, "origem"),
    regras,
    categoriaCombinacao,
    configuracaoComercial: normalizarConfiguracaoComercial(
      valor.configuracaoComercial,
    ),
  };
}

function normalizarConfiguracaoComercial(
  valor: unknown,
): ConfiguracaoComercialMapeamentoFornecedor | undefined {
  if (!ehRegistro(valor) || !ehRegistro(valor.prazoEntrega)) return undefined;

  const modalidade = obterTextoRegistro(valor, "modalidade");
  const estrategia = obterTextoRegistro(valor.prazoEntrega, "estrategia");
  const modalidadesValidas: ModalidadeComercialFornecedor[] = [
    "stock",
    "pre_sale",
    "dropshipping",
    "order_basis",
  ];
  const estrategiasValidas: EstrategiaPrazoEntregaFornecedor[] = [
    "valor_padrao_todos",
    "conciliacao",
    "rascunho",
    "ignorar",
  ];

  if (
    !modalidadesValidas.includes(modalidade as ModalidadeComercialFornecedor) ||
    !estrategiasValidas.includes(estrategia as EstrategiaPrazoEntregaFornecedor)
  ) {
    return undefined;
  }

  return {
    modalidade: modalidade as ModalidadeComercialFornecedor,
    prazoEntrega: {
      estrategia: estrategia as EstrategiaPrazoEntregaFornecedor,
      valorPadraoTexto:
        obterTextoRegistro(valor.prazoEntrega, "valorPadraoTexto") || undefined,
    },
  };
}

function normalizarCategoriaCombinacaoLaquila(
  valor: unknown,
): RegraCategoriaCombinacaoLaquilaTemporaria | undefined {
  if (!ehRegistro(valor)) return undefined;

  const estrategia = obterTextoRegistro(valor, "estrategia");
  const camposApi = Array.isArray(valor.camposApi)
    ? valor.camposApi
        .map((campo) => String(campo).trim())
        .filter((campo) => campo.length > 0)
    : [];
  const traducoes = Array.isArray(valor.traducoes)
    ? valor.traducoes
        .filter(ehRegistro)
        .map((traducao) => ({
          chave: obterTextoRegistro(traducao, "chave"),
          valores: Array.isArray(traducao.valores)
            ? traducao.valores.map((item) => String(item))
            : [],
          categoriaId: obterTextoRegistro(traducao, "categoriaId") || undefined,
          categoriaLabel:
            obterTextoRegistro(traducao, "categoriaLabel") || undefined,
        }))
        .filter((traducao) => traducao.chave.length > 0)
    : [];

  if (!estrategia || camposApi.length === 0 || traducoes.length === 0) {
    return undefined;
  }

  return {
    estrategia,
    camposApi,
    traducoes,
  };
}

function montarChaveCategoriaCombinacaoItem(
  item: ItemVinculoFornecedor,
  camposApi: string[],
) {
  return camposApi
    .map((campo) => {
      const valor = item.produtoRecebido.camposOrigem?.[campo]?.trim();
      return valor && valor.length > 0 ? valor : "Sem valor";
    })
    .join(" / ");
}

function obterCategoriaPorCombinacao(
  regrasMapeamento: RegrasMapeamentoLaquilaTemporarias | null,
  item?: ItemVinculoFornecedor,
) {
  const regraCombinacao = regrasMapeamento?.categoriaCombinacao;

  if (
    !item ||
    regraCombinacao?.estrategia !== "combinacao_campos_api" ||
    regraCombinacao.camposApi.length === 0
  ) {
    return null;
  }

  const chave = montarChaveCategoriaCombinacaoItem(
    item,
    regraCombinacao.camposApi,
  );
  const traducao = regraCombinacao.traducoes.find(
    (itemTraducao) => itemTraducao.chave === chave,
  );

  if (!traducao?.categoriaId) return null;

  return {
    categoriaId: traducao.categoriaId,
    categoriaNome: traducao.categoriaLabel,
  };
}

function obterValoresPadraoNovoProduto(
  regrasMapeamento: RegrasMapeamentoLaquilaTemporarias | null,
  item?: ItemVinculoFornecedor,
): ValoresPadraoRascunhoProdutoFornecedor {
  const regras = regrasMapeamento?.regras ?? [];
  const categoriaCombinada = obterCategoriaPorCombinacao(
    regrasMapeamento,
    item,
  );
  const regraCategoria = regras.find(
    (regra) =>
      regra.campoDestino === "categoria_fornecedor" &&
      regra.estrategia === "valor_padrao_todos" &&
      regra.valorPadraoId,
  );
  const regraMarca = regras.find(
    (regra) =>
      regra.campoDestino === "marca_fornecedor" &&
      regra.estrategia === "valor_padrao_todos" &&
      regra.valorPadraoId,
  );

  return {
    categoriaId:
      categoriaCombinada?.categoriaId ?? regraCategoria?.valorPadraoId,
    categoriaNome:
      categoriaCombinada?.categoriaNome ?? regraCategoria?.valorPadraoLabel,
    marcaId: regraMarca?.valorPadraoId,
    marcaNome: regraMarca?.valorPadraoLabel,
    configuracaoComercial: regrasMapeamento?.configuracaoComercial,
  };
}

function montarRascunhoConciliacaoLaquila(rascunho: RascunhoVinculoFornecedor) {
  return {
    item: rascunho.item,
    produto: rascunho.produto,
    codigoFornecedor: rascunho.codigoFornecedor,
    ean: rascunho.ean,
    origem: "laquila",
    atualizadoEm: new Date().toISOString(),
  };
}

type PaginaVinculosLaquilaAdminProps = {
  rascunhosIniciais: RascunhoConciliacaoLaquila[];
  fornecedorId: string | null;
  vinculosIniciais: VinculoProdutoLaquila[];
  sessaoAtiva: boolean;
};

export function PaginaVinculosLaquilaAdmin({
  rascunhosIniciais,
  fornecedorId,
  vinculosIniciais,
  sessaoAtiva,
}: PaginaVinculosLaquilaAdminProps) {
  const [selecaoCarregada, setSelecaoCarregada] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState<
    ItemVinculoFornecedor[]
  >([]);
  const [statusStaging, setStatusStaging] = useState<{
    tipo: "salvando" | "sucesso" | "erro";
    mensagem: string;
    totalSalvo?: number;
  } | null>(null);
  const [regrasMapeamento, setRegrasMapeamento] =
    useState<RegrasMapeamentoLaquilaTemporarias | null>(null);
  const valoresPadraoNovoProduto = useMemo(
    () => obterValoresPadraoNovoProduto(regrasMapeamento),
    [regrasMapeamento],
  );
  const obterValoresPadraoNovoProdutoItem = useCallback(
    (item: ItemVinculoFornecedor) =>
      obterValoresPadraoNovoProduto(regrasMapeamento, item),
    [regrasMapeamento],
  );
  const salvarRascunhosConciliacao = useCallback(
    (rascunhos: RascunhoVinculoFornecedor[]) => {
      window.sessionStorage.setItem(
        CHAVE_RASCUNHOS_CONCILIACAO_LAQUILA,
        JSON.stringify(rascunhos.map(montarRascunhoConciliacaoLaquila)),
      );
    },
    [],
  );
  const rascunhosPorCodigo = useMemo(() => {
    return new Map(
      rascunhosIniciais.flatMap((rascunho) =>
        rascunho.codigoFornecedor
          ? [[rascunho.codigoFornecedor.trim(), rascunho] as const]
          : [],
      ),
    );
  }, [rascunhosIniciais]);
  const vinculosPorCodigo = useMemo(
    () =>
      new Map(
        vinculosIniciais.map((vinculo) => [
          vinculo.codigoFornecedor.trim(),
          vinculo,
        ]),
      ),
    [vinculosIniciais],
  );
  const vincularProduto = useCallback(
    async ({
      item,
      produto,
    }: {
      item: ItemVinculoFornecedor;
      produto: { id: string };
    }) => {
      const codigoFornecedor = item.produtoRecebido.codigo?.trim();

      if (!fornecedorId || !codigoFornecedor) {
        return {
          sucesso: false,
          erro: "Fornecedor ou código do item não foi identificado.",
        };
      }

      return salvarVinculoProdutoRecebidoFornecedor({
        fornecedorId,
        codigoFornecedor,
        produtoId: produto.id,
      });
    },
    [fornecedorId],
  );

  useEffect(() => {
    const regrasSalvas = window.sessionStorage.getItem(
      CHAVE_REGRAS_MAPEAMENTO_LAQUILA,
    );

    if (regrasSalvas) {
      try {
        setRegrasMapeamento(
          normalizarRegrasMapeamentoLaquila(JSON.parse(regrasSalvas)),
        );
      } catch {
        setRegrasMapeamento(null);
      }
    }

    const selecaoSalva = window.sessionStorage.getItem(
      CHAVE_PRODUTOS_SELECIONADOS_MAPEAMENTO_LAQUILA,
    );

    if (!selecaoSalva) {
      setSelecaoCarregada(true);
      return;
    }

    try {
      const dados: unknown = JSON.parse(selecaoSalva);

      if (Array.isArray(dados)) {
        const produtosSelecionados = dados
          .map(normalizarProdutoSelecionado)
          .filter((produto): produto is ProdutoSelecionadoMapeamentoLaquila =>
            Boolean(produto),
          );

        setItensSelecionados(
          produtosSelecionados.map((produto) =>
            converterItemVinculo(
              produto,
              rascunhosPorCodigo.get(produto.cd_item.trim()),
              vinculosPorCodigo.get(produto.cd_item.trim()),
            ),
          ),
        );

        if (produtosSelecionados.length > 0) {
          setStatusStaging({
            tipo: "salvando",
            mensagem: "Salvando selecionados para vinculação...",
          });

          salvarProdutosSelecionadosStagingLaquila({ produtos: dados }).then(
            (resultado) => {
              if (resultado.sucesso) {
                setStatusStaging({
                  tipo: "sucesso",
                  mensagem:
                    resultado.mensagem ??
                    "Produtos selecionados salvos para vinculação.",
                  totalSalvo: resultado.totalSalvo,
                });
                return;
              }

              setStatusStaging({
                tipo: "erro",
                mensagem:
                  resultado.erro ??
                  "Não foi possível salvar os selecionados no staging.",
              });
            },
          );
        }
      }
    } catch {
      setItensSelecionados([]);
    } finally {
      setSelecaoCarregada(true);
    }
  }, [rascunhosPorCodigo, vinculosPorCodigo]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/admin/fornecedores/integracoes/laquila/mapeamento">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para mapeamento
            </Link>
          </Button>

          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Vínculos — Laquila
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Relacione os produtos recebidos da API com produtos existentes da
            loja.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="h-3 w-3" />
          API Laquila
        </Badge>
      </section>

      {!sessaoAtiva ? (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Sessão administrativa inativa
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Entre novamente para buscar produtos, vincular e salvar rascunhos.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-white">
            <Link href="/admin/login?redirect=/admin/fornecedores/integracoes/laquila/vinculos&erro=sessao_expirada">
              Entrar novamente
            </Link>
          </Button>
        </section>
      ) : null}

      {statusStaging ? (
        <section
          className={
            statusStaging.tipo === "erro"
              ? "rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-xs"
              : "rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-xs"
          }
        >
          {statusStaging.mensagem}
          {typeof statusStaging.totalSalvo === "number"
            ? ` ${statusStaging.totalSalvo} item${statusStaging.totalSalvo === 1 ? "" : "s"}.`
            : ""}
        </section>
      ) : null}

      {selecaoCarregada && itensSelecionados.length === 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 h-fit rounded-md bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-amber-950">
                  Nenhum produto selecionado
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-amber-800">
                  Volte para Recebidos da API e selecione produtos para
                  continuar.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="bg-white">
              <Link href="/admin/fornecedores/integracoes/laquila/produtos">
                Voltar para Recebidos da API
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {itensSelecionados.length > 0 ? (
        <TabelaVinculosFornecedor
          tipoOrigem="api"
          titulo="Vinculação de produtos"
          subtitulo="Revise quais itens da API Laquila correspondem a produtos já existentes na loja."
          labelProdutoRecebido="Produto da API"
          itens={itensSelecionados}
          produtosDaLoja={[]}
          textoAcaoPrincipal={`Continuar para Conciliação (${itensSelecionados.filter((item) => item.status === "rascunho" || item.rascunhoSalvo).length} rascunhos)`}
          hrefAcaoPrincipal="/admin/fornecedores/integracoes/laquila/conciliacao"
          totalRascunhosPersistidosInicial={rascunhosIniciais.length}
          aoBuscarProdutosLoja={buscarProdutosVinculoLaquila}
          aoVincularProdutoPersistido={vincularProduto}
          aoDesfazerVinculoPersistido={desfazerVinculoProdutoRecebidoFornecedor}
          valoresPadraoNovoProduto={valoresPadraoNovoProduto}
          obterValoresPadraoNovoProduto={obterValoresPadraoNovoProdutoItem}
          aoAlterarRascunhos={salvarRascunhosConciliacao}
          aoSalvarRascunhoPersistido={salvarRascunhoProdutoLaquila}
          aoRemoverRascunhoPersistido={removerRascunhoProdutoLaquila}
        />
      ) : null}
    </main>
  );
}
