"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHAVE_PRODUTOS_SELECIONADOS_MAPEAMENTO_LAQUILA } from "@/features/fornecedores/integracoes/laquila/constants";
import {
  type OpcaoValorPadraoLoja,
  TabelaMapeamentoCamposFornecedor,
} from "@/features/fornecedores/components/admin/tabela-mapeamento-campos-fornecedor";

const opcoesDestinoLaquila = [
  { valor: "codigo_fornecedor", label: "Código fornecedor" },
  { valor: "nome_produto", label: "Nome do produto" },
  { valor: "ean_gtin", label: "EAN/GTIN" },
  { valor: "ncm", label: "NCM" },
  { valor: "categoria_fornecedor", label: "Categoria da loja" },
  { valor: "marca_fornecedor", label: "Marca da loja" },
  { valor: "grupo_origem", label: "Grupo origem" },
  { valor: "macro_grupo_origem", label: "Macro grupo origem" },
  { valor: "subgrupo_origem", label: "Subgrupo origem" },
  { valor: "imagens", label: "Imagens" },
  { valor: "preco_fornecedor", label: "Preço principal/modalidade" },
  { valor: "estoque_fornecedor", label: "Estoque fornecedor" },
  { valor: "peso", label: "Peso" },
  { valor: "altura", label: "Altura" },
  { valor: "largura", label: "Largura" },
  { valor: "comprimento", label: "Comprimento" },
];

const linhasMapeamentoLaquila = [
  {
    id: "cd_item",
    nomeOrigem: "cd_item",
    descricaoOrigem: "Identificador do item no fornecedor",
    amostra: "24250",
    campoDestino: "codigo_fornecedor",
    situacao: "detectado_automaticamente",
    confianca: 96,
  },
  {
    id: "descricao",
    nomeOrigem: "descricao",
    descricaoOrigem: "Descrição principal recebida",
    amostra: "AMORTECEDOR DIANTEIRO",
    campoDestino: "nome_produto",
    situacao: "detectado_automaticamente",
    confianca: 94,
  },
  {
    id: "cd_ean",
    nomeOrigem: "cd_ean",
    descricaoOrigem: "Código de barras",
    amostra: "7891234567890",
    campoDestino: "ean_gtin",
    situacao: "detectado_automaticamente",
    confianca: 92,
  },
  {
    id: "NCM",
    nomeOrigem: "NCM",
    descricaoOrigem: "Classificação fiscal",
    amostra: "87089990",
    campoDestino: "ncm",
    situacao: "detectado_automaticamente",
    confianca: 90,
  },
  {
    id: "ds_ggrupo",
    nomeOrigem: "ds_ggrupo",
    descricaoOrigem: "Macro grupo comercial",
    amostra: "PEÇAS",
    campoDestino: "macro_grupo_origem",
    situacao: "automatico",
    confianca: 84,
  },
  {
    id: "ds_grupo",
    nomeOrigem: "ds_grupo",
    descricaoOrigem: "Agrupamento comercial",
    amostra: "Suspensão",
    campoDestino: "grupo_origem",
    situacao: "automatico",
    confianca: 86,
  },
  {
    id: "ds_sgrupo",
    nomeOrigem: "ds_sgrupo",
    descricaoOrigem: "Subgrupo comercial",
    amostra: "Amortecedores",
    campoDestino: "subgrupo_origem",
    situacao: "automatico",
    confianca: 84,
  },
  {
    id: "lista_fotos",
    nomeOrigem: "lista_fotos",
    descricaoOrigem: "URLs de fotos recebidas",
    amostra: "https://cdn.laquila.com.br/imagens/24250-1.jpg",
    campoDestino: "imagens",
    situacao: "automatico",
    confianca: 78,
  },
  {
    id: "vl_preco",
    nomeOrigem: "vl_preco",
    descricaoOrigem: "Preço retornado pelo saldo",
    amostra: "189.90",
    campoDestino: "preco_fornecedor",
    situacao: "pendente",
    confianca: 68,
  },
  {
    id: "qt_saldo",
    nomeOrigem: "qt_saldo",
    descricaoOrigem: "Quantidade disponível",
    amostra: "100",
    campoDestino: "estoque_fornecedor",
    situacao: "pendente",
    confianca: 68,
  },
  {
    id: "peso_bruto",
    nomeOrigem: "peso_bruto",
    descricaoOrigem: "Peso bruto recebido",
    amostra: "1.24",
    campoDestino: "peso",
    situacao: "automatico",
    confianca: 82,
  },
  {
    id: "altura_caixa",
    nomeOrigem: "altura_caixa",
    descricaoOrigem: "Altura da embalagem",
    amostra: "12",
    campoDestino: "altura",
    situacao: "automatico",
    confianca: 80,
  },
  {
    id: "largura_caixa",
    nomeOrigem: "largura_caixa",
    descricaoOrigem: "Largura da embalagem",
    amostra: "18",
    campoDestino: "largura",
    situacao: "automatico",
    confianca: 80,
  },
  {
    id: "comprimento_caixa",
    nomeOrigem: "comprimento_caixa",
    descricaoOrigem: "Comprimento da embalagem",
    amostra: "32",
    campoDestino: "comprimento",
    situacao: "automatico",
    confianca: 80,
  },
];

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
  dadosBrutosJson: Record<string, unknown>;
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
    dadosBrutosJson: ehRegistro(valor.dadosBrutosJson)
      ? valor.dadosBrutosJson
      : {},
  };
}

function formatarValorAmostra(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return "";

  if (Array.isArray(valor)) {
    return valor
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ");
  }

  if (typeof valor === "object") return JSON.stringify(valor);

  return String(valor).trim();
}

function obterAmostraCampo(
  produtos: ProdutoSelecionadoMapeamentoLaquila[],
  campo: keyof ProdutoSelecionadoMapeamentoLaquila,
) {
  const valores = Array.from(
    new Set(
      produtos
        .map((produto) => formatarValorAmostra(produto[campo]))
        .filter(Boolean),
    ),
  );

  if (valores.length === 0) return "Não recebido";

  return valores.slice(0, 3).join(" · ");
}

type PaginaMapeamentoLaquilaAdminProps = {
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: OpcaoValorPadraoLoja[];
};

export function PaginaMapeamentoLaquilaAdmin({
  categoriasLoja,
  marcasLoja,
}: PaginaMapeamentoLaquilaAdminProps) {
  const [selecaoCarregada, setSelecaoCarregada] = useState(false);
  const [produtosSelecionados, setProdutosSelecionados] = useState<
    ProdutoSelecionadoMapeamentoLaquila[]
  >([]);

  useEffect(() => {
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
        setProdutosSelecionados(
          dados
            .map(normalizarProdutoSelecionado)
            .filter((produto): produto is ProdutoSelecionadoMapeamentoLaquila =>
              Boolean(produto),
            ),
        );
      }
    } catch {
      setProdutosSelecionados([]);
    } finally {
      setSelecaoCarregada(true);
    }
  }, []);

  const linhasMapeamento = useMemo(() => {
    if (produtosSelecionados.length === 0) return linhasMapeamentoLaquila;

    return linhasMapeamentoLaquila.map((linha) => ({
      ...linha,
      amostra: obterAmostraCampo(
        produtosSelecionados,
        linha.id as keyof ProdutoSelecionadoMapeamentoLaquila,
      ),
    }));
  }, [produtosSelecionados]);

  const possuiProdutosSelecionados = produtosSelecionados.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/admin/fornecedores/integracoes/laquila/produtos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para recebidos
            </Link>
          </Button>

          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Mapeamento — Laquila
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Relacione os campos recebidos da API com os campos usados pela loja.
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

      {selecaoCarregada && possuiProdutosSelecionados ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-sm font-semibold text-slate-950">
            {produtosSelecionados.length} produto
            {produtosSelecionados.length === 1 ? "" : "s"} selecionado
            {produtosSelecionados.length === 1 ? "" : "s"} da API Laquila
          </p>
          <p className="mt-1 text-xs text-slate-500">
            O mapeamento usa apenas amostras dos campos recebidos. A lista de
            produtos aparece na etapa de Vinculação.
          </p>
        </section>
      ) : null}

      <TabelaMapeamentoCamposFornecedor
        tipoOrigem="api"
        titulo="Mapeamento — Laquila"
        subtitulo="Base visual para revisar Campo da API → Campo da loja antes de seguir para vínculos."
        labelPrimeiraColuna="Campo da API"
        labelAmostra="Exemplo recebido"
        linhas={linhasMapeamento}
        opcoesDestino={opcoesDestinoLaquila}
        categoriasLoja={categoriasLoja}
        marcasLoja={marcasLoja}
        textoAcaoPrincipal="Continuar para vinculação"
        tipoBotaoAcaoPrincipal="button"
        hrefAcaoPrincipal="/admin/fornecedores/integracoes/laquila/vinculos"
        textoRodape="Prévia visual. O mapeamento real será salvo em etapa posterior."
        estadoVazio="Nenhum campo da API disponível para mapear."
      />
    </main>
  );
}
