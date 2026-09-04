import { and, eq, inArray, or, sql } from "drizzle-orm";

import { createProduct } from "@/actions/admin/products/create";
import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  productPricingTable,
  productTable,
  productVariantTable,
  produtoRascunhosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { validarLogisticaProdutoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/validar-logistica-produto-laquila";
import {
  extrairConfiguracaoComercialRascunhoFornecedor,
  extrairSecoesLojaRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";
import { prepararDimensoesPublicacaoFornecedor } from "@/features/fornecedores/lib/publicacao/preparar-dimensoes-publicacao-fornecedor";
import { validarLogisticaProduto } from "@/features/logistica/lib/validar-logistica-produto";
import { salvarIdentificadorCatalogo } from "@/features/products/actions/salvar-identificador-catalogo";
import { gerarSkuDisponivel as gerarSkuDisponivelCompartilhado } from "@/features/products/lib/gerar-sku-disponivel";
import { validarGtin } from "@/features/products/lib/identificadores-catalogo";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/lib/variante-tecnica-produto-simples";

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
  return gerarSkuDisponivelCompartilhado({
    nomeCategoria,
    nomeMarca,
    skuExiste: async (sku) => {
      const [existente] = await db
        .select({ id: productTable.id })
        .from(productTable)
        .leftJoin(productVariantTable, eq(productVariantTable.sku, sku))
        .where(or(eq(productTable.sku, sku), eq(productVariantTable.sku, sku)))
        .limit(1);
      return Boolean(existente);
    },
  });
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
      produtoAtualizadoId: produtoRascunhosTable.produtoAtualizadoId,
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

  // Bifurcação única entre os dois caminhos. Tudo daqui para baixo continua
  // sendo, sem nenhuma alteração, o caminho original de CRIAR produto novo.
  if (rascunho.produtoAtualizadoId) {
    return publicarAtualizacaoProdutoVinculadoFornecedor({
      id: rascunho.id,
      produtoAtualizadoId: rascunho.produtoAtualizadoId,
      precoLoja: rascunho.precoLoja,
      estoqueFornecedor: rascunho.estoqueFornecedor,
      ean: rascunho.ean,
      fornecedorId: rascunho.fornecedorId,
      codigoFornecedor: rascunho.codigoFornecedor,
      // Só chegam preenchidos quando o gestor editou o campo na Conciliação —
      // o rascunho de item vinculado nasce com os três vazios.
      categoriaId: rascunho.categoriaId,
      marcaId: rascunho.marcaId,
      secoesLoja: extrairSecoesLojaRascunhoFornecedor(rascunho.dadosOrigemJson),
    });
  }

  const precoLoja = numeroNaoNegativo(rascunho.precoLoja);
  const gtinFornecedor = rascunho.ean?.trim()
    ? validarGtin(rascunho.ean)
    : null;
  if (gtinFornecedor && !gtinFornecedor.valido) {
    throw new Error(
      `O EAN recebido do fornecedor não é um GTIN válido (${gtinFornecedor.motivo.replaceAll("_", " ")}).`,
    );
  }
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
  const dimensoesPublicacao = prepararDimensoesPublicacaoFornecedor({
    origemTipo: origem.origemTipo,
    origemProvedor: origem.origemProvedor,
    dimensoes: {
      peso: rascunho.peso,
      altura: rascunho.altura,
      largura: rascunho.largura,
      comprimento: rascunho.comprimento,
    },
  });

  const logisticaGeral = validarLogisticaProduto({
    pesoEmGramas: dimensoesPublicacao.pesoEmKg
      ? Math.round(Number(dimensoesPublicacao.pesoEmKg) * 1000)
      : null,
    alturaEmCm: dimensoesPublicacao.alturaEmCm
      ? Number(dimensoesPublicacao.alturaEmCm)
      : null,
    larguraEmCm: dimensoesPublicacao.larguraEmCm
      ? Number(dimensoesPublicacao.larguraEmCm)
      : null,
    comprimentoEmCm: dimensoesPublicacao.comprimentoEmCm
      ? Number(dimensoesPublicacao.comprimentoEmCm)
      : null,
    tiposEntregaPermitidos: ["own"],
  });
  if (!logisticaGeral.valido) {
    throw new Error(
      `Produto não pode ser publicado. Dados logísticos incompletos: ${logisticaGeral.problemas.map((problema) => problema.campo).join(", ")}.`,
    );
  }

  if (
    origem.origemTipo === "fornecedor_api" &&
    origem.origemProvedor === "laquila"
  ) {
    const logistica = validarLogisticaProdutoLaquila({
      pesoEmGramas: dimensoesPublicacao.pesoEmKg
        ? Math.round(Number(dimensoesPublicacao.pesoEmKg) * 1000)
        : null,
      alturaEmCm: dimensoesPublicacao.alturaEmCm
        ? Number(dimensoesPublicacao.alturaEmCm)
        : null,
      larguraEmCm: dimensoesPublicacao.larguraEmCm
        ? Number(dimensoesPublicacao.larguraEmCm)
        : null,
      comprimentoEmCm: dimensoesPublicacao.comprimentoEmCm
        ? Number(dimensoesPublicacao.comprimentoEmCm)
        : null,
      possuiVinculoFornecedor: true,
      codigoFornecedor,
      tiposEntregaPermitidos: ["supplier"],
    });
    if (!logistica.valido) {
      throw new Error(
        `Produto Laquila não pode ser publicado. Dados logísticos incompletos: ${logistica.problemas.map((problema) => problema.campo).join(", ")}.`,
      );
    }
  }

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
    // EAN explícito possui destino canônico próprio; productCode permanece um
    // código genérico independente e não recebe mais esse valor.
    gtinProdutoSimples: gtinFornecedor?.valido
      ? gtinFornecedor.valor
      : undefined,
    procedenciaIdentificadores: {
      origem: "fornecedor_importacao",
      fornecedorId,
      referenciaOrigem: `${origem.origemProvedor}:${rascunho.id}:${codigoFornecedor}`,
    },
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
      pesoEmKg: dimensoesPublicacao.pesoEmKg ?? undefined,
      alturaEmCm: dimensoesPublicacao.alturaEmCm ?? undefined,
      larguraEmCm: dimensoesPublicacao.larguraEmCm ?? undefined,
      comprimentoEmCm: dimensoesPublicacao.comprimentoEmCm ?? undefined,
    },
    status: "published",
    isActive: true,
    allowedDeliveryTypes:
      origem.origemTipo === "fornecedor_api" &&
      origem.origemProvedor === "laquila"
        ? ["supplier"]
        : undefined,
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

  // Estado terminal também no caminho "criar".
  //
  // Antes, só a existência de um vínculo ativo sinalizava que este rascunho já
  // tinha virado produto — um sinal indireto, que os contadores por importação
  // não conseguem ler (o vínculo é permanente e não pertence a execução
  // nenhuma). Marcar o rascunho fecha o ciclo no lugar certo: a #101 sabe
  // quantos itens ELA publicou, e a #102 continua livre para trazer o mesmo
  // código de novo.
  await db
    .update(produtoRascunhosTable)
    .set({ status: "publicado", atualizadoEm: new Date() })
    .where(eq(produtoRascunhosTable.id, rascunho.id));

  return {
    rascunhoId: rascunho.id,
    produtoId: resultadoProduto.productId,
    varianteTecnicaId: resultadoProduto.varianteTecnicaId,
    slug: resultadoProduto.slug,
    sku,
  };
}

/**
 * Modalidade sob a qual este fluxo publica, no vocabulário de
 * `product_pricing.type`: `"stock"` é como o banco representa "Estoque Próprio"
 * (ver `MODALIDADES_PRECO_PRODUTO` em features/products/constants).
 *
 * Produto atualizado por importação de fornecedor passa a ser vendido com
 * estoque em casa, então é essa modalidade que vira o card principal — o
 * Dropshipping herdado do cadastro anterior deixa de ser o preço em destaque.
 */
const MODALIDADE_PUBLICACAO_FORNECEDOR = "stock";

/** Prazo gravado em `delivery_days` para a modalidade publicada por este fluxo. */
const PRAZO_PUBLICACAO_FORNECEDOR = "1 dia útil";

type RascunhoAtualizacaoProdutoVinculadoFornecedor = {
  id: string;
  produtoAtualizadoId: string;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  ean: string | null;
  fornecedorId: string | null;
  codigoFornecedor: string | null;
  /**
   * Campos de catálogo que o gestor pode ter reescrito na Conciliação.
   *
   * `null` (ou lista vazia) significa "não alterar": o rascunho de um item
   * vinculado nasce sem categoria, marca e seções, e só recebe valor quando
   * alguém decide explicitamente mudá-los. É essa distinção que permite
   * aplicar a decisão do gestor sem deixar o arquivo do fornecedor sobrescrever
   * o catálogo por conta própria.
   */
  categoriaId: string | null;
  marcaId: string | null;
  secoesLoja: string[];
};

/**
 * Publica um rascunho "atualizar produto existente": nunca cria produto,
 * só aplica preço/estoque ao produto real já vinculado — e só os campos
 * cujo valor de origem está presente, para nunca apagar dado existente.
 *
 * Deixa o produto vendendo por Estoque Próprio com prazo de 1 dia útil, que é a
 * condição real de quem recebeu a mercadoria do fornecedor. As demais
 * modalidades continuam cadastradas, apenas perdem o posto de card principal.
 *
 * Nome, categoria, descrição, imagens, SEO e qualquer outro campo do produto
 * real ficam intocados de propósito: o fornecedor manda preço e estoque, não
 * o conteúdo do catálogo.
 */
async function publicarAtualizacaoProdutoVinculadoFornecedor(
  rascunho: RascunhoAtualizacaoProdutoVinculadoFornecedor,
) {
  const precoLoja = numeroNaoNegativo(rascunho.precoLoja);
  const gtinFornecedor = rascunho.ean?.trim()
    ? validarGtin(rascunho.ean)
    : null;
  if (gtinFornecedor && !gtinFornecedor.valido) {
    throw new Error(
      `O EAN recebido do fornecedor não é um GTIN válido (${gtinFornecedor.motivo.replaceAll("_", " ")}).`,
    );
  }

  if (!precoLoja || precoLoja <= 0) {
    throw new Error(
      "Defina o preço a aplicar antes de publicar esta atualização.",
    );
  }

  const precoEmCentavos = Math.round(precoLoja * 100);
  const agora = new Date();

  // Transação com lock de linha: usa `dbTransacional` (node-postgres) porque o
  // cliente HTTP do Neon não suporta transação nem `for("update")`.
  const produto = await dbTransacional.transaction(async (tx) => {
    const [produtoBloqueado] = await tx
      .select({
        id: productTable.id,
        tipoProduto: productTable.productKind,
        marcaId: productTable.marcaId,
        sku: productTable.sku,
        slug: productTable.slug,
      })
      .from(productTable)
      .where(eq(productTable.id, rascunho.produtoAtualizadoId))
      .for("update");

    if (!produtoBloqueado) {
      throw new Error("O produto vinculado não existe mais na loja.");
    }
    if (produtoBloqueado.tipoProduto !== "simple") {
      throw new Error(
        "Este fluxo só atualiza produtos simples (sem variantes).",
      );
    }

    // Todas as modalidades do produto entram no lock: a promoção de "Estoque
    // Próprio" a card principal precisa rebaixar as outras no mesmo instante,
    // senão o produto poderia ficar com dois cards principais.
    const modalidadesBloqueadas = await tx
      .select({
        id: productPricingTable.id,
        tipo: productPricingTable.type,
        principal: productPricingTable.mainCardPrice,
        temPromocao: productPricingTable.hasPromo,
        precoPromocional: productPricingTable.promoPrice,
      })
      .from(productPricingTable)
      .where(eq(productPricingTable.productId, produtoBloqueado.id))
      .for("update");

    // Reutiliza a modalidade existente em vez de criar outra: um produto que já
    // vendia por Estoque Próprio não pode terminar a publicação com duas linhas
    // `stock` disputando o card principal.
    const [estoqueProprioExistente] = modalidadesBloqueadas.filter(
      (modalidade) => modalidade.tipo === MODALIDADE_PUBLICACAO_FORNECEDOR,
    );

    // Promoção ativa na linha reutilizada venceria o preço que estamos
    // publicando: a vitrine e o carrinho passam a usar `promo_price_in_cents`
    // (ver `obterPrecoModalidadeVigente`), então o produto exibiria o preço
    // antigo da promoção com o preço do fornecedor já gravado ao lado.
    //
    // Cancelar promoção é decisão do módulo de promoções, não deste fluxo —
    // por isso aqui a publicação para e explica, em vez de sobrescrever.
    if (
      estoqueProprioExistente?.temPromocao &&
      estoqueProprioExistente.precoPromocional
    ) {
      throw new Error(
        "A modalidade Estoque Próprio deste produto está em promoção. Encerre a promoção antes de publicar a atualização, senão a loja continuaria vendendo pelo preço promocional.",
      );
    }

    let idEstoqueProprio: string;

    if (estoqueProprioExistente) {
      idEstoqueProprio = estoqueProprioExistente.id;
      await tx
        .update(productPricingTable)
        .set({
          price: precoEmCentavos,
          deliveryDays: PRAZO_PUBLICACAO_FORNECEDOR,
          pricingModalDescription: PRAZO_PUBLICACAO_FORNECEDOR,
          mainCardPrice: true,
          isActive: true,
          updatedAt: agora,
        })
        .where(eq(productPricingTable.id, estoqueProprioExistente.id));
    } else {
      const [criada] = await tx
        .insert(productPricingTable)
        .values({
          productId: produtoBloqueado.id,
          type: MODALIDADE_PUBLICACAO_FORNECEDOR,
          price: precoEmCentavos,
          deliveryDays: PRAZO_PUBLICACAO_FORNECEDOR,
          pricingModalDescription: PRAZO_PUBLICACAO_FORNECEDOR,
          mainCardPrice: true,
          isActive: true,
          updatedAt: agora,
        })
        .returning({ id: productPricingTable.id });

      if (!criada) {
        throw new Error(
          "Não foi possível registrar a modalidade Estoque Próprio do produto.",
        );
      }
      idEstoqueProprio = criada.id;
    }

    // As outras modalidades continuam cadastradas — Dropshipping segue
    // disponível como secundária —, só deixam de ser o card principal. Nada é
    // apagado: o catálogo do produto não é assunto do fornecedor.
    const idsParaRebaixar = modalidadesBloqueadas
      .filter(
        (modalidade) =>
          modalidade.id !== idEstoqueProprio && modalidade.principal,
      )
      .map((modalidade) => modalidade.id);

    if (idsParaRebaixar.length > 0) {
      await tx
        .update(productPricingTable)
        .set({ mainCardPrice: false, updatedAt: agora })
        .where(inArray(productPricingTable.id, idsParaRebaixar));
    }

    // A variante técnica é escolhida pela regra estrita compartilhada, e não
    // pela primeira linha que o banco devolver: produto simples deve ter
    // exatamente uma variante interna coerente. Escrever numa linha ambígua
    // alteraria preço e estoque de uma variante real por engano.
    const variantesBloqueadas = await tx
      .select({
        id: productVariantTable.id,
        sku: productVariantTable.sku,
        atributos: productVariantTable.attributes,
        precoEmCentavos: productVariantTable.priceInCents,
        estoque: productVariantTable.stockQuantity,
        ativa: productVariantTable.isActive,
        principal: productVariantTable.isDefault,
      })
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, produtoBloqueado.id))
      .for("update");

    const identificacao = identificarVarianteTecnicaProdutoSimples({
      skuProduto: produtoBloqueado.sku,
      variantes: variantesBloqueadas,
    });

    if (identificacao.situacao !== "confiavel") {
      throw new Error(
        `Não é possível atualizar este produto com segurança: ${identificacao.motivo}`,
      );
    }

    // O preço vai para os DOIS lugares, como no caminho de criação: a vitrine
    // lê `product_pricing`, mas carrinho e fechamento de pedido cobram por
    // `product_variant.price_in_cents`. Atualizar só um dos dois faria a loja
    // exibir o preço novo e cobrar o antigo.
    await tx
      .update(productVariantTable)
      .set({
        priceInCents: precoEmCentavos,
        // Estoque ausente na origem não apaga o estoque atual do produto.
        ...(rascunho.estoqueFornecedor !== null && {
          stockQuantity: Math.max(0, rascunho.estoqueFornecedor),
        }),
        updatedAt: agora,
      })
      .where(eq(productVariantTable.id, identificacao.variante.id));

    if (gtinFornecedor?.valido && rascunho.fornecedorId) {
      await salvarIdentificadorCatalogo({
        tipo: "gtin",
        valor: gtinFornecedor.valor,
        varianteId: identificacao.variante.id,
        marcaId: produtoBloqueado.marcaId,
        origem: "fornecedor_importacao",
        fornecedorId: rascunho.fornecedorId,
        referenciaOrigem: `rascunho:${rascunho.id}:${rascunho.codigoFornecedor ?? "sem-codigo"}`,
        executor: tx,
      });
    }

    // Campos de catálogo: só entram quando o gestor decidiu mudá-los na
    // Conciliação. Um rascunho de item vinculado nasce sem categoria, marca e
    // seções, então "vazio" aqui significa literalmente "não alterar" — o
    // arquivo do fornecedor continua sem poder reescrever o catálogo sozinho.
    const catalogoParaAtualizar = {
      ...(rascunho.categoriaId ? { categoryId: rascunho.categoriaId } : {}),
      ...(rascunho.marcaId ? { marcaId: rascunho.marcaId } : {}),
      ...(rascunho.secoesLoja.length > 0
        ? { storeProductFlags: rascunho.secoesLoja }
        : {}),
    };

    if (Object.keys(catalogoParaAtualizar).length > 0) {
      await tx
        .update(productTable)
        .set({ ...catalogoParaAtualizar, updatedAt: agora })
        .where(eq(productTable.id, produtoBloqueado.id));
    }

    // Estado terminal do caminho "atualizar": some da Conciliação e da
    // Publicação sem depender do sinal de vínculo ativo, que aqui já existia.
    await tx
      .update(produtoRascunhosTable)
      .set({ status: "publicado", atualizadoEm: agora })
      .where(eq(produtoRascunhosTable.id, rascunho.id));

    return { ...produtoBloqueado, varianteId: identificacao.variante.id };
  });

  return {
    rascunhoId: rascunho.id,
    produtoId: produto.id,
    varianteTecnicaId: produto.varianteId,
    slug: produto.slug,
    sku: produto.sku,
  };
}
