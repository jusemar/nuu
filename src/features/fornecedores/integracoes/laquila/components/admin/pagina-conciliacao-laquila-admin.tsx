"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ProductFormData } from "@/app/admin/products/new/data/product-form-data";
import { Button } from "@/components/ui/button";
import {
  type EntradaAjustarPrecosConciliacaoFornecedor,
  type EntradaAtualizarCamposRascunhosFornecedor,
  type ItemConciliacaoFornecedor,
  TabelaConciliacaoFornecedor,
} from "@/features/fornecedores/components/admin/tabela-conciliacao-fornecedor";
import type { ItemVinculoFornecedor } from "@/features/fornecedores/components/admin/tabela-vinculos-fornecedor";
import {
  ajustarPrecosRascunhosLaquila,
  atualizarCamposRascunhosLaquila,
} from "@/features/fornecedores/integracoes/laquila/actions";
import type { RascunhoConciliacaoLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

type RascunhoConciliacaoLaquilaPersistido = {
  item: ItemVinculoFornecedor;
  produto: ProductFormData;
  codigoFornecedor: string | null;
  ean: string | null;
  origem?: string;
  atualizadoEm?: string;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarRascunhoConciliacao(
  valor: unknown,
): RascunhoConciliacaoLaquilaPersistido | null {
  if (!ehRegistro(valor)) return null;

  const item = valor.item;
  const produto = valor.produto;

  if (!ehRegistro(item) || !ehRegistro(produto)) return null;
  if (typeof item.id !== "string" || typeof produto.name !== "string") {
    return null;
  }

  return valor as RascunhoConciliacaoLaquilaPersistido;
}

function obterPrecoPrincipal(produto: ProductFormData) {
  const variantePadrao = produto.variants?.find(
    (variante) => variante.isDefault,
  );
  const precoEmCentavos = variantePadrao?.priceInCents;

  if (typeof precoEmCentavos === "number" && precoEmCentavos > 0) {
    return String(precoEmCentavos / 100);
  }

  const precoDropshipping = produto.pricing?.modalities?.dropshipping?.price;
  if (typeof precoDropshipping === "string" && precoDropshipping.trim()) {
    return precoDropshipping;
  }

  const precoEstoque = produto.pricing?.modalities?.stock?.price;
  if (typeof precoEstoque === "string" && precoEstoque.trim()) {
    return precoEstoque;
  }

  return null;
}

function obterEstoquePrincipal(produto: ProductFormData) {
  const variantePadrao = produto.variants?.find(
    (variante) => variante.isDefault,
  );
  const estoque = variantePadrao?.stockQuantity;

  return typeof estoque === "number" && Number.isFinite(estoque)
    ? estoque
    : null;
}

function montarRegrasObrigatorias(
  rascunho: RascunhoConciliacaoLaquilaPersistido,
): ItemConciliacaoFornecedor["regrasObrigatorias"] {
  const regras: ItemConciliacaoFornecedor["regrasObrigatorias"] = [];
  const categoria = rascunho.produto.categoryId;
  const marca = rascunho.produto.brand || rascunho.produto.brandId;

  regras.push({
    campo: "categoria_fornecedor",
    label: "Categoria da loja",
    estrategia: categoria ? "valor_padrao" : "conciliacao",
    valorAplicado: categoria || null,
    observacao: categoria
      ? "Categoria aplicada no rascunho da Vinculação."
      : "Categoria ainda precisa ser definida.",
    bloqueiaPublicacao: !categoria,
  });

  regras.push({
    campo: "marca_fornecedor",
    label: "Marca da loja",
    estrategia: marca ? "valor_padrao" : "conciliacao",
    valorAplicado: marca || null,
    observacao: marca
      ? "Marca aplicada no rascunho da Vinculação."
      : "Marca ainda precisa ser definida.",
    bloqueiaPublicacao: !marca,
  });

  return regras;
}

function montarRegrasImportantes(
  rascunho: RascunhoConciliacaoLaquilaPersistido,
): ItemConciliacaoFornecedor["regrasImportantes"] {
  return [
    {
      campo: "ncm",
      label: "NCM",
      estrategia: rascunho.produto.ncmCode ? "valor_padrao" : "conciliacao",
      valorAplicado: rascunho.produto.ncmCode || null,
      observacao: rascunho.produto.ncmCode
        ? "NCM preenchido no rascunho."
        : "NCM ausente no rascunho.",
    },
    {
      campo: "ean_gtin",
      label: "EAN/GTIN",
      estrategia: rascunho.ean ? "valor_padrao" : "conciliacao",
      valorAplicado: rascunho.ean,
      observacao: rascunho.ean
        ? "EAN recebido da Laquila."
        : "EAN não recebido ou não preenchido.",
    },
  ];
}

function montarPendencias(rascunho: RascunhoConciliacaoLaquilaPersistido) {
  const pendencias: string[] = [];

  if (!rascunho.produto.name.trim()) pendencias.push("Nome obrigatório");
  if (!rascunho.produto.categoryId) pendencias.push("Categoria obrigatória");
  if (!rascunho.produto.brand && !rascunho.produto.brandId) {
    pendencias.push("Marca obrigatória");
  }
  if (!obterPrecoPrincipal(rascunho.produto)) {
    pendencias.push("Preço principal ausente");
  }

  return pendencias;
}

function montarAlertas(rascunho: RascunhoConciliacaoLaquilaPersistido) {
  const alertas: string[] = [];

  if (!rascunho.produto.images?.length) alertas.push("Sem imagem recebida");
  if (!rascunho.produto.ncmCode) alertas.push("NCM ausente");
  if (!rascunho.ean) alertas.push("EAN ausente");

  return alertas;
}

function converterRascunhoParaConciliacao(
  rascunho: RascunhoConciliacaoLaquilaPersistido,
): ItemConciliacaoFornecedor {
  const pendencias = montarPendencias(rascunho);
  const alertas = montarAlertas(rascunho);
  const preco = obterPrecoPrincipal(rascunho.produto);
  const estoque = obterEstoquePrincipal(rascunho.produto);
  const status =
    pendencias.length > 0
      ? "pendencia"
      : alertas.length > 0
        ? "alerta"
        : "pronto";

  return {
    id: rascunho.item.id,
    produto: {
      nome: rascunho.produto.name || rascunho.item.produtoRecebido.nome,
      codigo:
        rascunho.codigoFornecedor ??
        rascunho.item.produtoRecebido.codigo ??
        null,
      preco,
      estoque,
      complemento: rascunho.item.produtoRecebido.complemento ?? "Laquila API",
    },
    acaoPrevista: "criar",
    statusVinculacao: "novo",
    status,
    pendenciasObrigatorias: pendencias,
    alertas,
    regrasObrigatorias: montarRegrasObrigatorias(rascunho),
    regrasImportantes: montarRegrasImportantes(rascunho),
    configuracaoPreco: {
      modalidade: "Dropshipping",
      valorAplicado: preco,
      prazo: rascunho.produto.pricing?.modalities?.dropshipping?.deliveryText,
      cardPrincipal: true,
      origem: "Rascunho salvo na Vinculação",
    },
  };
}

function converterRascunhoBancoParaConciliacao(
  rascunho: RascunhoConciliacaoLaquila,
): ItemConciliacaoFornecedor {
  const pendencias: string[] = [];
  const alertas: string[] = [];
  const configuracaoComercial = rascunho.configuracaoComercial;
  const prazoEntrega =
    configuracaoComercial.prazoEntrega.valorPadraoTexto ?? null;

  if (!rascunho.nome.trim()) pendencias.push("Falta nome do produto");
  if (!rascunho.categoriaId) pendencias.push("Falta categoria");
  if (!rascunho.marcaId) pendencias.push("Falta marca");
  if (!rascunho.precoLoja || Number(rascunho.precoLoja) <= 0) {
    pendencias.push("Falta preço da loja");
  }
  if (!rascunho.secoesLoja.length) pendencias.push("Falta seção da loja");
  if (!configuracaoComercial.modalidade) {
    pendencias.push("Falta modalidade comercial");
  }
  if (!rascunho.imagens.length) alertas.push("Sem imagem recebida");
  if (!rascunho.ncm) alertas.push("NCM ausente");
  if (!rascunho.ean) alertas.push("EAN ausente");
  if (
    configuracaoComercial.prazoEntrega.estrategia !== "ignorar" &&
    !prazoEntrega
  ) {
    pendencias.push("Falta prazo de entrega");
  }

  const status =
    rascunho.status === "ignorado"
      ? "ignorado"
      : pendencias.length > 0
        ? "pendencia"
        : alertas.length > 0
          ? "alerta"
          : "pronto";

  return {
    id: rascunho.id,
    produto: {
      nome: rascunho.nome,
      codigo: rascunho.codigoFornecedor,
      preco: rascunho.precoLoja ?? rascunho.precoFornecedor,
      precoFornecedor: rascunho.precoFornecedor,
      precoLoja: rascunho.precoLoja,
      estoque: rascunho.estoqueFornecedor,
      complemento: "Laquila API",
      imagemUrl: rascunho.imagens[0] ?? null,
    },
    acaoPrevista: rascunho.status === "ignorado" ? "ignorar" : "criar",
    statusVinculacao: rascunho.status === "ignorado" ? "ignorado" : "novo",
    status,
    pendenciasObrigatorias: pendencias,
    alertas,
    regrasObrigatorias: [
      {
        campo: "categoria_fornecedor",
        label: "Categoria da loja",
        estrategia: rascunho.categoriaId ? "valor_padrao" : "conciliacao",
        valorAplicado: rascunho.categoriaNome ?? rascunho.categoriaId,
        observacao: rascunho.categoriaId
          ? "Categoria aplicada no rascunho universal."
          : "Categoria ainda precisa ser definida.",
        bloqueiaPublicacao: !rascunho.categoriaId,
      },
      {
        campo: "marca_fornecedor",
        label: "Marca da loja",
        estrategia: rascunho.marcaId ? "valor_padrao" : "conciliacao",
        valorAplicado: rascunho.marcaNome ?? rascunho.marcaId,
        observacao: rascunho.marcaId
          ? "Marca aplicada no rascunho universal."
          : "Marca ainda precisa ser definida.",
        bloqueiaPublicacao: !rascunho.marcaId,
      },
      {
        campo: "preco_loja",
        label: "Preço loja",
        estrategia: rascunho.precoLoja ? "valor_padrao" : "conciliacao",
        valorAplicado: rascunho.precoLoja,
        observacao: rascunho.precoLoja
          ? "Preço loja preparado para publicação futura."
          : "Defina o preço de venda da loja.",
        bloqueiaPublicacao: !rascunho.precoLoja,
      },
    ],
    regrasImportantes: [
      {
        campo: "ncm",
        label: "NCM",
        estrategia: rascunho.ncm ? "valor_padrao" : "conciliacao",
        valorAplicado: rascunho.ncm,
        observacao: rascunho.ncm ? "NCM recebido." : "NCM ausente.",
      },
      {
        campo: "ean_gtin",
        label: "EAN/GTIN",
        estrategia: rascunho.ean ? "valor_padrao" : "conciliacao",
        valorAplicado: rascunho.ean,
        observacao: rascunho.ean ? "EAN recebido." : "EAN ausente.",
      },
      {
        campo: "prazo_entrega",
        label: "Prazo de entrega",
        estrategia:
          configuracaoComercial.prazoEntrega.estrategia === "valor_padrao_todos"
            ? "valor_padrao"
            : configuracaoComercial.prazoEntrega.estrategia,
        valorAplicado: prazoEntrega,
        observacao:
          configuracaoComercial.prazoEntrega.estrategia === "ignorar"
            ? "Ignorado por enquanto conforme o Mapeamento."
            : prazoEntrega
              ? "Prazo padrão aplicado pelo Mapeamento."
              : "Prazo será revisado na Conciliação.",
      },
    ],
    configuracaoPreco: {
      modalidade: obterLabelModalidadeComercial(
        configuracaoComercial.modalidade,
      ),
      valorAplicado: rascunho.precoLoja ?? rascunho.precoFornecedor,
      prazo: prazoEntrega ?? undefined,
      cardPrincipal: true,
      origem: "Rascunho universal",
    },
    motivoIgnorado:
      rascunho.status === "ignorado" ? "Marcado como ignorado" : null,
    camposRascunho: {
      categoriaId: rascunho.categoriaId,
      categoriaNome: rascunho.categoriaNome,
      marcaId: rascunho.marcaId,
      marcaNome: rascunho.marcaNome,
      secoesLoja: rascunho.secoesLoja,
      ncm: rascunho.ncm,
      ean: rascunho.ean,
      peso: rascunho.peso,
      altura: rascunho.altura,
      largura: rascunho.largura,
      comprimento: rascunho.comprimento,
      statusRascunho: rascunho.status,
      modalidadeComercial: configuracaoComercial.modalidade,
      prazoEntrega,
    },
  };
}

function obterLabelModalidadeComercial(
  modalidade: string | null,
): "Dropshipping" | "Estoque próprio" | "Pré-venda" | "Sob encomenda" | null {
  const labels: Record<
    string,
    "Dropshipping" | "Estoque próprio" | "Pré-venda" | "Sob encomenda"
  > = {
    stock: "Estoque próprio",
    pre_sale: "Pré-venda",
    dropshipping: "Dropshipping",
    order_basis: "Sob encomenda",
  };

  return modalidade ? (labels[modalidade] ?? null) : null;
}

type PaginaConciliacaoLaquilaAdminProps = {
  rascunhosIniciais: RascunhoConciliacaoLaquila[];
  sessaoAtiva: boolean;
  categoriasLoja: Array<{ id: string; nome: string }>;
  marcasLoja: Array<{ id: string; nome: string }>;
};

export function PaginaConciliacaoLaquilaAdmin({
  rascunhosIniciais,
  sessaoAtiva,
  categoriasLoja,
  marcasLoja,
}: PaginaConciliacaoLaquilaAdminProps) {
  const [rascunhosBanco, setRascunhosBanco] = useState(rascunhosIniciais);

  useEffect(() => {
    setRascunhosBanco(rascunhosIniciais);
  }, [rascunhosIniciais]);

  const itensConciliacao = useMemo(
    () => rascunhosBanco.map(converterRascunhoBancoParaConciliacao),
    [rascunhosBanco],
  );

  async function atualizarCamposComReflexoImediato(
    entrada: EntradaAtualizarCamposRascunhosFornecedor,
  ) {
    const resultado = await atualizarCamposRascunhosLaquila(entrada);

    if (!resultado.sucesso) return resultado;

    setRascunhosBanco((atuais) =>
      atuais.map((rascunho) => {
        if (!entrada.rascunhoIds.includes(rascunho.id)) return rascunho;

        if (entrada.campo === "marca") {
          return {
            ...rascunho,
            marcaId: entrada.marcaId,
            marcaNome:
              marcasLoja.find((marca) => marca.id === entrada.marcaId)?.nome ??
              rascunho.marcaNome,
          };
        }

        if (entrada.campo === "categoria") {
          return {
            ...rascunho,
            categoriaId: entrada.categoriaId,
            categoriaNome:
              categoriasLoja.find(
                (categoria) => categoria.id === entrada.categoriaId,
              )?.nome ?? rascunho.categoriaNome,
          };
        }

        if (entrada.campo === "preco_loja") {
          return { ...rascunho, precoLoja: entrada.precoLoja.toFixed(2) };
        }

        if (entrada.campo === "secoes_loja") {
          return { ...rascunho, secoesLoja: entrada.secoesLoja };
        }

        if (entrada.campo === "modalidade_comercial") {
          return {
            ...rascunho,
            configuracaoComercial: {
              ...rascunho.configuracaoComercial,
              modalidade: entrada.modalidade,
            },
          };
        }

        return {
          ...rascunho,
          configuracaoComercial: {
            ...rascunho.configuracaoComercial,
            prazoEntrega: {
              estrategia: "valor_padrao_todos" as const,
              valorPadraoTexto: entrada.prazoEntrega,
            },
          },
        };
      }),
    );

    return resultado;
  }

  async function ajustarPrecosComReflexoImediato(
    entrada: EntradaAjustarPrecosConciliacaoFornecedor,
  ) {
    const resultado = await ajustarPrecosRascunhosLaquila(entrada);

    if (!resultado.sucesso || !resultado.precosAtualizados) return resultado;

    const novosPrecos = new Map(
      resultado.precosAtualizados.map((preco) => [
        preco.rascunhoId,
        preco.precoLoja,
      ]),
    );
    setRascunhosBanco((atuais) =>
      atuais.map((rascunho) => ({
        ...rascunho,
        precoLoja: novosPrecos.get(rascunho.id) ?? rascunho.precoLoja,
      })),
    );

    return resultado;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      {!sessaoAtiva ? (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Sessão administrativa inativa
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Entre novamente para ajustar os preços dos rascunhos.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-white">
            <Link href="/admin/login?redirect=/admin/fornecedores/integracoes/laquila/conciliacao&erro=sessao_expirada">
              Entrar novamente
            </Link>
          </Button>
        </section>
      ) : null}
      {itensConciliacao.length === 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 h-fit rounded-md bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-amber-950">
                  Nenhum rascunho encontrado para conciliação.
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-amber-800">
                  Volte para Vinculação, salve produtos como rascunho e continue
                  para Conciliação.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="bg-white">
              <Link href="/admin/fornecedores/integracoes/laquila/vinculos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Vinculação
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {itensConciliacao.length > 0 ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
            <p className="text-sm font-semibold text-slate-950">
              Produtos em conciliação
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {itensConciliacao.length} rascunho
              {itensConciliacao.length === 1 ? "" : "s"} carregado
              {itensConciliacao.length === 1 ? "" : "s"} do banco.
            </p>
          </section>

          <TabelaConciliacaoFornecedor
            tipoOrigem="api"
            fornecedor="Laquila"
            titulo="Conciliação — Laquila"
            subtitulo="Revise os rascunhos salvos na Vinculação antes da etapa de publicação."
            hrefVoltar="/admin/fornecedores/integracoes/laquila/vinculos"
            hrefProximaEtapa="/admin/fornecedores/integracoes/laquila/publicacao"
            itens={itensConciliacao}
            aoAjustarPrecosSelecionados={ajustarPrecosComReflexoImediato}
            aoAtualizarCamposRascunhos={atualizarCamposComReflexoImediato}
            categoriasLoja={categoriasLoja}
            marcasLoja={marcasLoja}
          />
        </>
      ) : null}
    </main>
  );
}
