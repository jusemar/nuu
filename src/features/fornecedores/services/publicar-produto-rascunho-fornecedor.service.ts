import { and, eq, or, sql } from "drizzle-orm";

import { createProduct } from "@/actions/admin/products/create";
import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  productTable,
  productVariantTable,
  produtoRascunhosTable,
} from "@/db/schema";
import {
  extrairConfiguracaoComercialRascunhoFornecedor,
  extrairSecoesLojaRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";
import { gerarSkuProduto } from "@/features/products/lib/gerar-sku-produto";

type OrigemTipoRascunhoFornecedor =
  | "manual"
  | "fornecedor_api"
  | "fornecedor_excel";

type OrigemPublicacaoRascunhoFornecedor = {
  origemTipo: OrigemTipoRascunhoFornecedor;
  origemProvedor: string;
  importacaoId?: string;
  nomeOrigem: string;
  modalidadePadrao?: "stock" | "pre_sale" | "dropshipping" | "order_basis";
  prazoEntregaPadrao?: string;
};

function normalizarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function gerarSlugDisponivel(nome: string) {
  const base = normalizarSlug(nome) || "produto";

  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const slug = tentativa === 0 ? base : `${base}-${tentativa + 1}`;
    const [existente] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.slug, slug))
      .limit(1);
    if (!existente) return slug;
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function gerarSkuDisponivel(nomeCategoria: string, nomeMarca: string) {
  for (let tentativa = 0; tentativa < 20; tentativa += 1) {
    const sku = gerarSkuProduto({ nomeCategoria, nomeMarca });
    const [existente] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .leftJoin(productVariantTable, eq(productVariantTable.sku, sku))
      .where(or(eq(productTable.sku, sku), eq(productVariantTable.sku, sku)))
      .limit(1);
    if (!existente) return sku;
  }

  throw new Error("Não foi possível gerar um SKU interno único.");
}

function numeroNaoNegativo(valor: string | null) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function obterChaveModalidadeCadastroProduto(
  modalidade: "stock" | "pre_sale" | "dropshipping" | "order_basis" | null,
) {
  if (modalidade === "pre_sale") return "preSale";
  if (modalidade === "order_basis") return "orderBasis";

  return modalidade ?? "dropshipping";
}

/**
 * Publica um rascunho de fornecedor pelo mesmo fluxo do cadastro manual de
 * produto simples. A origem apenas restringe qual rascunho pode ser usado.
 */
export async function publicarProdutoRascunhoFornecedor(
  rascunhoId: string,
  origem: OrigemPublicacaoRascunhoFornecedor,
) {
  const filtrosOrigem = [
    eq(produtoRascunhosTable.id, rascunhoId),
    eq(produtoRascunhosTable.origemTipo, origem.origemTipo),
    eq(produtoRascunhosTable.origemProvedor, origem.origemProvedor),
  ];

  if (origem.importacaoId) {
    filtrosOrigem.push(
      sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${origem.importacaoId}`,
    );
  }

  const [rascunho] = await db
    .select({
      id: produtoRascunhosTable.id,
      fornecedorId: produtoRascunhosTable.fornecedorId,
      codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
      nome: produtoRascunhosTable.nome,
      descricao: produtoRascunhosTable.descricao,
      categoriaId: produtoRascunhosTable.categoriaId,
      categoriaNome: categoryTable.name,
      marcaId: produtoRascunhosTable.marcaId,
      marcaNome: marcaTable.nome,
      ean: produtoRascunhosTable.ean,
      ncm: produtoRascunhosTable.ncm,
      precoFornecedor: produtoRascunhosTable.precoFornecedor,
      precoLoja: produtoRascunhosTable.precoLoja,
      estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
      peso: produtoRascunhosTable.peso,
      altura: produtoRascunhosTable.altura,
      largura: produtoRascunhosTable.largura,
      comprimento: produtoRascunhosTable.comprimento,
      imagens: produtoRascunhosTable.imagens,
      dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
    })
    .from(produtoRascunhosTable)
    .leftJoin(
      categoryTable,
      eq(produtoRascunhosTable.categoriaId, categoryTable.id),
    )
    .leftJoin(marcaTable, eq(produtoRascunhosTable.marcaId, marcaTable.id))
    .where(and(...filtrosOrigem))
    .limit(1);

  if (!rascunho) {
    throw new Error(`Rascunho ${origem.nomeOrigem} não encontrado.`);
  }

  const precoLoja = numeroNaoNegativo(rascunho.precoLoja);
  const secoesLoja = extrairSecoesLojaRascunhoFornecedor(
    rascunho.dadosOrigemJson,
  );
  const configuracaoComercial = extrairConfiguracaoComercialRascunhoFornecedor(
    rascunho.dadosOrigemJson,
  );
  const modalidade =
    configuracaoComercial.modalidade ?? origem.modalidadePadrao ?? null;
  const modalidadePrincipal = obterChaveModalidadeCadastroProduto(modalidade);
  const prazoEntrega =
    configuracaoComercial.prazoEntrega.valorPadraoTexto?.trim() ||
    origem.prazoEntregaPadrao?.trim() ||
    null;
  const pendencias = [
    !rascunho.nome.trim() ? "nome" : null,
    !rascunho.fornecedorId ? "fornecedor" : null,
    !rascunho.codigoFornecedor?.trim() ? "código do fornecedor" : null,
    !rascunho.categoriaId || !rascunho.categoriaNome ? "categoria" : null,
    !rascunho.marcaId || !rascunho.marcaNome ? "marca" : null,
    !precoLoja || precoLoja <= 0 ? "preço da loja" : null,
    secoesLoja.length === 0 ? "seção da loja" : null,
    !modalidade ? "modalidade comercial" : null,
    configuracaoComercial.prazoEntrega.estrategia !== "ignorar" && !prazoEntrega
      ? "prazo de entrega"
      : null,
  ].filter((campo): campo is string => Boolean(campo));

  if (pendencias.length > 0) {
    throw new Error(`Preencha antes de publicar: ${pendencias.join(", ")}.`);
  }

  if (
    !rascunho.fornecedorId ||
    !rascunho.codigoFornecedor ||
    !rascunho.categoriaId ||
    !rascunho.categoriaNome ||
    !rascunho.marcaId ||
    !rascunho.marcaNome ||
    precoLoja === null
  ) {
    throw new Error("O rascunho ainda possui campos obrigatórios pendentes.");
  }

  const fornecedorId = rascunho.fornecedorId;
  const codigoFornecedor = rascunho.codigoFornecedor;
  const categoriaId = rascunho.categoriaId;
  const categoriaNome = rascunho.categoriaNome;
  const marcaId = rascunho.marcaId;
  const marcaNome = rascunho.marcaNome;

  const [vinculoExistente] = await db
    .select({
      id: fornecedorProdutoVinculosTable.id,
      status: fornecedorProdutoVinculosTable.status,
    })
    .from(fornecedorProdutoVinculosTable)
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedorId),
        eq(fornecedorProdutoVinculosTable.codigoFornecedor, codigoFornecedor),
      ),
    )
    .limit(1);

  if (vinculoExistente?.status === "ativo") {
    throw new Error("Este rascunho já foi publicado.");
  }

  const sku = await gerarSkuDisponivel(categoriaNome, marcaNome);
  const slug = await gerarSlugDisponivel(rascunho.nome);
  const precoEmCentavos = Math.round(precoLoja * 100);
  const estoque = Math.max(0, rascunho.estoqueFornecedor ?? 0);
  const imagemPrincipal = rascunho.imagens[0] ?? null;

  const resultadoProduto = await createProduct({
    name: rascunho.nome,
    slug,
    description: rascunho.descricao?.trim() || rascunho.nome,
    cardShortText: rascunho.nome.slice(0, 160),
    categoryId: categoriaId,
    brandId: marcaId,
    brand: marcaNome,
    sku,
    productKind: "simple",
    productCode: rascunho.ean?.trim() || undefined,
    ncmCode: rascunho.ncm?.trim() || undefined,
    storeProductFlags: secoesLoja,
    pricing: {
      costPrice: rascunho.precoFornecedor ?? undefined,
      mainCardPriceType: modalidadePrincipal,
      modalities: {
        [modalidadePrincipal]: {
          price: precoLoja.toFixed(2),
          deliveryText: prazoEntrega ?? "",
        },
      },
    },
    images: rascunho.imagens.map((url, indice) => ({
      url,
      isPrimary: indice === 0,
      altText: rascunho.nome,
    })),
    dimensoesFreteExterno: {
      pesoEmKg: rascunho.peso ?? undefined,
      alturaEmCm: rascunho.altura ?? undefined,
      larguraEmCm: rascunho.largura ?? undefined,
      comprimentoEmCm: rascunho.comprimento ?? undefined,
    },
    status: "published",
    isActive: true,
    varianteTecnicaProdutoSimples: {
      precoEmCentavos,
      estoque,
      imagemUrl: imagemPrincipal,
    },
  });

  if (!resultadoProduto.success || !resultadoProduto.productId) {
    throw new Error(
      resultadoProduto.error ?? "Não foi possível criar o produto.",
    );
  }

  try {
    if (vinculoExistente) {
      await db
        .update(fornecedorProdutoVinculosTable)
        .set({
          produtoId: resultadoProduto.productId,
          tipoVinculo: "automatico",
          status: "ativo",
          atualizadoEm: new Date(),
        })
        .where(eq(fornecedorProdutoVinculosTable.id, vinculoExistente.id));
    } else {
      await db.insert(fornecedorProdutoVinculosTable).values({
        fornecedorId,
        codigoFornecedor,
        produtoId: resultadoProduto.productId,
        tipoVinculo: "automatico",
        status: "ativo",
        atualizadoEm: new Date(),
      });
    }
  } catch (erro) {
    await db
      .delete(productTable)
      .where(eq(productTable.id, resultadoProduto.productId));
    throw erro;
  }

  return {
    rascunhoId: rascunho.id,
    produtoId: resultadoProduto.productId,
    varianteTecnicaId: resultadoProduto.varianteTecnicaId,
    slug: resultadoProduto.slug,
    sku,
  };
}
