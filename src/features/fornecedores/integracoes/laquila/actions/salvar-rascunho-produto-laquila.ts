"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutosApiStagingTable,
} from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { salvarProdutoRascunhoFornecedor } from "@/features/fornecedores/services/salvar-produto-rascunho-fornecedor.service";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";
import { buscarImportacaoApiLaquila } from "../queries/buscar-importacao-api-laquila";

const produtoRecebidoRascunhoSchema = z.object({
  id: z.string().trim().min(1),
  nome: z.string().trim().min(1),
  codigo: z.string().trim().nullable().optional(),
  ean: z.string().trim().nullable().optional(),
  ncm: z.string().trim().nullable().optional(),
  preco: z.string().trim().nullable().optional(),
  estoque: z.number().nullable().optional(),
  imagens: z.array(z.string().trim()).optional(),
  pesoBruto: z.string().trim().nullable().optional(),
  alturaCaixa: z.string().trim().nullable().optional(),
  larguraCaixa: z.string().trim().nullable().optional(),
  comprimentoCaixa: z.string().trim().nullable().optional(),
  complemento: z.string().trim().nullable().optional(),
});

const salvarRascunhoProdutoLaquilaSchema = z.object({
  // Execução dona deste rascunho. Sem ela o rascunho não pertence a ciclo
  // nenhum e a Conciliação da execução seguinte o veria como se fosse dela.
  importacaoId: z.uuid(),
  item: produtoRecebidoRascunhoSchema,
  produto: z.record(z.string(), z.unknown()),
});

type ResultadoSalvarRascunhoProdutoLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  rascunhoId?: string;
  rascunho?: {
    id: string;
    nome: string;
    categoriaId: string | null;
    marcaId: string | null;
    marcaNome: string | null;
    precoLoja: string | null;
  };
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function obterTexto(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);

  return "";
}

function obterPrecoProduto(produto: Record<string, unknown>) {
  const pricing = produto.pricing;

  if (ehRegistro(pricing)) {
    const modalidades = pricing.modalities;

    if (ehRegistro(modalidades)) {
      const modalidadePrincipal = obterTexto(pricing, "mainCardPriceType");
      const chavePrincipal =
        modalidadePrincipal === "pre_sale"
          ? "preSale"
          : modalidadePrincipal === "order_basis"
            ? "orderBasis"
            : modalidadePrincipal;
      const chaves = Array.from(
        new Set([
          chavePrincipal,
          "dropshipping",
          "stock",
          "preSale",
          "orderBasis",
        ]),
      ).filter(Boolean);

      for (const chave of chaves) {
        const modalidade = modalidades[chave];

        if (ehRegistro(modalidade)) {
          const preco = obterTexto(modalidade, "price");
          if (preco) return preco;
        }
      }
    }

    const custo = obterTexto(pricing, "costPrice");
    if (custo) return custo;
  }

  const variantes = produto.variants;
  if (Array.isArray(variantes)) {
    const variantePadrao = variantes.find(
      (variante) => ehRegistro(variante) && variante.isDefault === true,
    );

    if (ehRegistro(variantePadrao)) {
      const precoCentavos = variantePadrao.priceInCents;

      if (typeof precoCentavos === "number" && precoCentavos > 0) {
        return String(precoCentavos / 100);
      }
    }
  }

  return "";
}

function obterConfiguracaoComercialProduto(produto: Record<string, unknown>) {
  const pricing = produto.pricing;
  if (!ehRegistro(pricing)) return null;

  const configuracaoMapeamento = pricing.configuracaoMapeamentoComercial;
  const modalidadeFormulario = obterTexto(pricing, "mainCardPriceType");
  const modalidade =
    modalidadeFormulario === "preSale"
      ? "pre_sale"
      : modalidadeFormulario === "orderBasis"
        ? "order_basis"
        : modalidadeFormulario;
  const configuracaoPrazo = ehRegistro(configuracaoMapeamento)
    ? configuracaoMapeamento.prazoEntrega
    : null;
  const modalidades = pricing.modalities;
  const chaveModalidade =
    modalidade === "pre_sale"
      ? "preSale"
      : modalidade === "order_basis"
        ? "orderBasis"
        : modalidade;
  const dadosModalidade =
    ehRegistro(modalidades) && ehRegistro(modalidades[chaveModalidade])
      ? modalidades[chaveModalidade]
      : null;

  return {
    modalidade: modalidade || "dropshipping",
    prazoEntrega: {
      estrategia: ehRegistro(configuracaoPrazo)
        ? obterTexto(configuracaoPrazo, "estrategia") || "conciliacao"
        : "conciliacao",
      valorPadraoTexto:
        ehRegistro(configuracaoPrazo) &&
        obterTexto(configuracaoPrazo, "valorPadraoTexto")
          ? obterTexto(configuracaoPrazo, "valorPadraoTexto")
          : dadosModalidade
            ? obterTexto(dadosModalidade, "deliveryText") || undefined
            : undefined,
    },
  };
}

function obterEstoqueProduto(produto: Record<string, unknown>) {
  const variantes = produto.variants;
  if (!Array.isArray(variantes)) return null;

  const variantePadrao = variantes.find(
    (variante) => ehRegistro(variante) && variante.isDefault === true,
  );

  if (!ehRegistro(variantePadrao)) return null;

  const estoque = variantePadrao.stockQuantity;

  return typeof estoque === "number" && Number.isFinite(estoque)
    ? estoque
    : null;
}

function obterImagensProduto(produto: Record<string, unknown>) {
  const imagens = produto.images;

  if (!Array.isArray(imagens)) return [];

  return imagens
    .map((imagem) => {
      if (typeof imagem === "string") return imagem.trim();
      if (ehRegistro(imagem)) return obterTexto(imagem, "url");

      return "";
    })
    .filter((url) => url.length > 0);
}

async function buscarLinhaStagingDaImportacao({
  importacaoId,
  codigoFornecedor,
}: {
  importacaoId: string;
  codigoFornecedor: string | null;
}) {
  if (!codigoFornecedor) return null;

  const [linha] = await db
    .select({ id: fornecedorProdutosApiStagingTable.id })
    .from(fornecedorProdutosApiStagingTable)
    .where(
      and(
        eq(fornecedorProdutosApiStagingTable.importacaoId, importacaoId),
        eq(
          fornecedorProdutosApiStagingTable.codigoFornecedor,
          codigoFornecedor,
        ),
      ),
    )
    .limit(1);

  return linha ?? null;
}

async function buscarIntegracaoLaquilaAtual() {
  const [integracao] = await db
    .select({
      id: fornecedorIntegracoesApiTable.id,
      fornecedorId: fornecedorIntegracoesApiTable.fornecedorId,
    })
    .from(fornecedorIntegracoesApiTable)
    .where(
      eq(fornecedorIntegracoesApiTable.provedor, PROVEDOR_INTEGRACAO_LAQUILA),
    )
    .limit(1);

  return integracao ?? null;
}

export async function salvarRascunhoProdutoLaquila(
  entrada: unknown,
): Promise<ResultadoSalvarRascunhoProdutoLaquila> {
  const validacao = salvarRascunhoProdutoLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Dados inválidos para salvar o rascunho.",
    };
  }

  const sessaoValida = await possuiSessaoFornecedoresAdmin();

  if (!sessaoValida) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para salvar o rascunho.",
    };
  }

  const integracao = await buscarIntegracaoLaquilaAtual();

  if (!integracao) {
    return {
      sucesso: false,
      erro: "Configuração Laquila não encontrada para salvar o rascunho.",
    };
  }

  const importacao = await buscarImportacaoApiLaquila(
    validacao.data.importacaoId,
  );

  if (!importacao) {
    return {
      sucesso: false,
      erro: "Importação da API não encontrada para salvar o rascunho.",
    };
  }

  try {
    const { item, produto } = validacao.data;
    const agora = new Date();
    // Linha de staging DESTA execução que originou o rascunho. É por ela que a
    // Conciliação sabe voltar atrás ("desfazer") sem tocar em outro ciclo.
    const linhaStaging = await buscarLinhaStagingDaImportacao({
      importacaoId: importacao.id,
      codigoFornecedor: item.codigo?.trim() ?? null,
    });
    const nome = obterTexto(produto, "name") || item.nome;
    const descricao = obterTexto(produto, "description") || item.complemento;
    const categoriaId = obterTexto(produto, "categoryId") || null;
    const marcaId = obterTexto(produto, "brandId") || null;
    const precoLoja = obterPrecoProduto(produto) || item.preco || null;
    const estoqueFornecedor = obterEstoqueProduto(produto) ?? item.estoque;
    const imagens = obterImagensProduto(produto);
    const codigoFornecedor = item.codigo?.trim() || null;
    const configuracaoComercial = obterConfiguracaoComercialProduto(produto);

    const dadosRascunho = {
      origemTipo: "fornecedor_api" as const,
      origemProvedor: PROVEDOR_INTEGRACAO_LAQUILA,
      fornecedorId: integracao.fornecedorId,
      integracaoApiId: integracao.id,
      codigoFornecedor,
      nome,
      descricao,
      categoriaId,
      marcaId,
      ean: item.ean?.trim() || obterTexto(produto, "productCode") || null,
      ncm: item.ncm?.trim() || obterTexto(produto, "ncmCode") || null,
      precoFornecedor: item.preco || null,
      precoLoja,
      estoqueFornecedor,
      peso: item.pesoBruto || null,
      altura: item.alturaCaixa || null,
      largura: item.larguraCaixa || null,
      comprimento: item.comprimentoCaixa || null,
      imagens: imagens.length > 0 ? imagens : (item.imagens ?? []),
      dadosOrigemJson: {
        itemRecebido: item,
        produtoRascunho: produto,
        codigoFornecedor,
        configuracaoComercial,
        // Mesma convenção do fluxo de arquivo: é este bloco que amarra o
        // rascunho a uma execução, e todas as queries e actions
        // compartilhadas filtram por ele.
        origemFluxoFornecedor: {
          importacaoId: importacao.id,
          stagingId: linhaStaging?.id ?? null,
          origem: "api",
          provedor: PROVEDOR_INTEGRACAO_LAQUILA,
        },
        secoesLoja:
          Array.isArray(produto.storeProductFlags) &&
          produto.storeProductFlags.length > 0
            ? produto.storeProductFlags
            : ["general"],
      },
      status: "pendente_conciliacao" as const,
      atualizadoEm: agora,
    };

    if (!codigoFornecedor) {
      return {
        sucesso: false,
        erro: "Código do fornecedor é obrigatório para salvar o rascunho.",
      };
    }

    const rascunho = await salvarProdutoRascunhoFornecedor({
      ...dadosRascunho,
      fornecedorId: integracao.fornecedorId,
      codigoFornecedor,
    });

    revalidatePath(
      `/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/vinculos`,
    );
    revalidatePath(
      `/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/conciliacao`,
    );

    return {
      sucesso: true,
      mensagem:
        "Rascunho salvo com sucesso. Revise este produto na Conciliação.",
      rascunhoId: rascunho.id,
      rascunho: {
        id: rascunho.id,
        nome,
        categoriaId,
        marcaId,
        marcaNome: obterTexto(produto, "brand") || null,
        precoLoja,
      },
    };
  } catch (erro) {
    console.error("[salvarRascunhoProdutoLaquila]", {
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível salvar o rascunho do produto.",
    };
  }
}
