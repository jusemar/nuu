"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ItemVinculoFornecedor,
  TabelaVinculosFornecedor,
} from "@/features/fornecedores/components/admin/tabela-vinculos-fornecedor";
import { CHAVE_PRODUTOS_SELECIONADOS_MAPEAMENTO_LAQUILA } from "@/features/fornecedores/integracoes/laquila/constants";

const produtosDaLojaMock = [
  {
    id: "produto-loja-1",
    nome: "Amortecedor dianteiro premium",
    sku: "AMT-001",
    categoria: "Suspensão",
    preco: "219.9",
  },
  {
    id: "produto-loja-2",
    nome: "Kit suporte do bico injetor",
    sku: "KIT-110012",
    categoria: "Injeção",
    preco: "84.9",
    jaVinculado: true,
  },
  {
    id: "produto-loja-3",
    nome: "Pastilha de freio dianteira",
    sku: "PST-4450",
    categoria: "Freios",
    preco: "139.9",
  },
  {
    id: "produto-loja-4",
    nome: "Filtro de óleo blindado",
    sku: "FLT-7781",
    categoria: "Filtros",
    preco: "42.5",
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
    },
    status: "aguardando",
    produtoLoja: null,
  };
}

export function PaginaVinculosLaquilaAdmin() {
  const [selecaoCarregada, setSelecaoCarregada] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState<
    ItemVinculoFornecedor[]
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
        setItensSelecionados(
          dados
            .map(normalizarProdutoSelecionado)
            .filter((produto): produto is ProdutoSelecionadoMapeamentoLaquila =>
              Boolean(produto),
            )
            .map(converterItemVinculo),
        );
      }
    } catch {
      setItensSelecionados([]);
    } finally {
      setSelecaoCarregada(true);
    }
  }, []);

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
          produtosDaLoja={produtosDaLojaMock}
          textoAcaoPrincipal="Continuar para conciliação"
          hrefAcaoPrincipal="/admin/fornecedores/integracoes/laquila/conciliacao"
        />
      ) : null}
    </main>
  );
}
