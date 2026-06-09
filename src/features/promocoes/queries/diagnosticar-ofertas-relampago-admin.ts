import "server-only";

import { asc, eq, inArray, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import {
  productPricingTable,
  productTable,
  productVariantTable,
} from "../../../db/schema";
import { adaptarPrecosVitrine } from "../../precificacao";
import type {
  ItemDiagnosticoOfertaRelampagoAdmin,
  ResultadoDiagnosticoOfertasRelampagoAdmin,
} from "../types";

type ProdutoDiagnosticoBanco = typeof productTable.$inferSelect;
type PrecoDiagnosticoBanco = typeof productPricingTable.$inferSelect;
type VarianteDiagnosticoBanco = typeof productVariantTable.$inferSelect;

function indexarPorProduto<TItem extends { productId: string }>(
  itens: TItem[],
) {
  const mapa = new Map<string, TItem[]>();

  itens.forEach((item) => {
    const atuais = mapa.get(item.productId) ?? [];
    atuais.push(item);
    mapa.set(item.productId, atuais);
  });

  return mapa;
}

function formatarDataComparacao(data: Date | null) {
  return data?.toISOString() ?? null;
}

function valoresDivergentes(valorOficial: unknown, valorLegado: unknown) {
  return valorOficial !== valorLegado;
}

function resolverStatusDiagnostico({
  oficialAtivo,
  legadoAtivo,
  legadoMigrado,
  precoOficial,
  precoLegado,
  badgeOficial,
  badgeLegado,
  countdownOficial,
  countdownLegado,
}: {
  oficialAtivo: boolean;
  legadoAtivo: boolean;
  legadoMigrado: boolean;
  precoOficial: number | null;
  precoLegado: number | null;
  badgeOficial: string | null;
  badgeLegado: string | null;
  countdownOficial: Date | null;
  countdownLegado: Date | null;
}): Pick<ItemDiagnosticoOfertaRelampagoAdmin, "status" | "motivo"> {
  if (oficialAtivo && legadoMigrado) {
    return {
      status: "legado_migrado",
      motivo: "Fallback legado equivalente ja marcado como migrado.",
    };
  }

  if (!oficialAtivo && !legadoAtivo) {
    return {
      status: "sem_promocao",
      motivo: "Sem oferta relâmpago oficial ou legada ativa.",
    };
  }

  if (oficialAtivo && !legadoAtivo) {
    return {
      status: "oficial_validado",
      motivo: "Oferta relâmpago oficial ativa sem fallback legado equivalente.",
    };
  }

  if (!oficialAtivo && legadoAtivo) {
    return {
      status: "usando_legado",
      motivo: "Oferta relâmpago legada ativa preservada como fallback.",
    };
  }

  const divergencias = [
    valoresDivergentes(precoOficial, precoLegado) ? "preço" : null,
    valoresDivergentes(badgeOficial, badgeLegado) ? "badge" : null,
    valoresDivergentes(
      formatarDataComparacao(countdownOficial),
      formatarDataComparacao(countdownLegado),
    )
      ? "countdown"
      : null,
  ].filter(Boolean);

  if (divergencias.length > 0) {
    return {
      status: "divergente",
      motivo: `Divergência entre oficial e legado: ${divergencias.join(", ")}.`,
    };
  }

  return {
    status: "oficial_validado",
    motivo: "Oferta oficial e fallback legado equivalentes.",
  };
}

function resolverOrigemItem(
  item: Parameters<typeof resolverStatusDiagnostico>[0] & {
    origemAplicada: string;
  },
): ItemDiagnosticoOfertaRelampagoAdmin["origem"] {
  if (item.origemAplicada === "promotion_engine" && item.oficialAtivo) {
    return "oficial";
  }

  if (item.origemAplicada === "legado" && item.legadoAtivo) {
    return "legado";
  }

  if (item.oficialAtivo) {
    return "oficial";
  }

  if (item.legadoAtivo) {
    return "legado";
  }

  return "sem_promocao";
}

export async function diagnosticarOfertasRelampagoAdmin(): Promise<ResultadoDiagnosticoOfertasRelampagoAdmin> {
  const dataReferencia = new Date();
  const produtos = await db
    .select()
    .from(productTable)
    .where(
      or(eq(productTable.isActive, true), eq(productTable.status, "active")),
    )
    .orderBy(asc(productTable.name))
    .limit(80);
  const produtosIds = produtos.map((produto) => produto.id);

  if (produtosIds.length === 0) {
    return {
      itens: [],
      resumo: {
        totalItens: 0,
        totalOficiais: 0,
        totalLegados: 0,
        totalSemPromocao: 0,
        totalOficiaisValidados: 0,
        totalLegadosMigrados: 0,
        totalUsandoLegado: 0,
        totalDivergentes: 0,
      },
      dataReferencia,
    };
  }

  const [precos, variantes] = await Promise.all([
    db
      .select()
      .from(productPricingTable)
      .where(inArray(productPricingTable.productId, produtosIds)),
    db
      .select()
      .from(productVariantTable)
      .where(inArray(productVariantTable.productId, produtosIds)),
  ]);
  const precosPorProduto = indexarPorProduto(precos);
  const variantesPorProduto = indexarPorProduto(variantes);
  const produtosPrecificaveis = produtos.map((produto) => ({
    id: produto.id,
    productKind: produto.productKind,
    pricing: (precosPorProduto.get(produto.id) ?? []).map(
      (preco: PrecoDiagnosticoBanco) => ({
        type: preco.type,
        price: preco.price,
        mainCardPrice: preco.mainCardPrice,
        pricingModalDescription: preco.pricingModalDescription,
        deliveryDays: preco.deliveryDays,
        hasPromo: preco.hasPromo,
        promoType: preco.promoType,
        promoPrice: preco.promoPrice,
        promoEndDate: preco.promoEndDate,
        legadoPromocaoMigradoEm: preco.legadoPromocaoMigradoEm,
        legadoPromocaoMigradoParaRegraId:
          preco.legadoPromocaoMigradoParaRegraId,
        isActive: preco.isActive,
      }),
    ),
    variants: (variantesPorProduto.get(produto.id) ?? []).map(
      (variante: VarianteDiagnosticoBanco) => ({
        id: variante.id,
        sku: variante.sku,
        name: variante.name,
        priceInCents: variante.priceInCents,
        comparePriceInCents: variante.comparePriceInCents,
        stockQuantity: variante.stockQuantity,
        isActive: variante.isActive,
      }),
    ),
  }));
  const precosVitrine = await adaptarPrecosVitrine(produtosPrecificaveis);
  const produtosPorId = new Map<string, ProdutoDiagnosticoBanco>(
    produtos.map((produto) => [produto.id, produto]),
  );
  const itens = Object.values(precosVitrine.precosPorChave).map((preco) => {
    const produto = produtosPorId.get(preco.produtoId);
    const oficialAtivo =
      preco.promocaoEngine.ativa &&
      preco.promocaoEngine.tipoCampanha === "relampago";
    const legadoAtivo =
      preco.promocaoLegadaEngine.ativa &&
      preco.promocaoLegada.tipoCampanha === "oferta_relampago";
    const legadoMigrado = Boolean(preco.legadoPromocaoMigradoEm);
    const countdownOficial =
      preco.promocaoEngine.countdownPromocionalDataFim ?? null;
    const countdownLegado = preco.promocaoLegada.countdown.dataFim;
    const precoOficial = oficialAtivo
      ? preco.promocaoEngine.precoFinalEmCentavos
      : null;
    const precoLegado = legadoAtivo
      ? preco.promocaoLegadaEngine.precoFinalEmCentavos
      : null;
    const badgeOficial = oficialAtivo ? "relampago" : null;
    const badgeLegado = legadoAtivo ? preco.promocaoLegada.badge : null;
    const statusDiagnostico = resolverStatusDiagnostico({
      oficialAtivo,
      legadoAtivo,
      legadoMigrado,
      precoOficial,
      precoLegado,
      badgeOficial,
      badgeLegado,
      countdownOficial,
      countdownLegado,
    });
    const origem = resolverOrigemItem({
      oficialAtivo,
      legadoAtivo,
      legadoMigrado,
      precoOficial,
      precoLegado,
      badgeOficial,
      badgeLegado,
      countdownOficial,
      countdownLegado,
      origemAplicada: preco.origemPromocaoAplicada,
    });

    return {
      chave: preco.chave,
      produtoId: preco.produtoId,
      produto: produto?.name ?? "Produto não encontrado",
      slug: produto?.slug ?? "",
      sku: produto?.sku ?? "",
      modalidade: preco.modalidade,
      varianteId: preco.varianteId,
      produtoVariavel: preco.produtoVariavel,
      precoOriginalEmCentavos: preco.precoOriginalEmCentavos,
      precoPromocionalEmCentavos: preco.precoFinalEmCentavos,
      badge: preco.badgePromocional,
      countdownDataFim: preco.countdownPromocional.dataFim,
      origem,
      status: statusDiagnostico.status,
      motivo: statusDiagnostico.motivo,
      oficial: {
        ativo: oficialAtivo,
        regraPromocaoId: preco.promocaoEngine.regraAplicadaId,
        precoPromocionalEmCentavos: precoOficial,
        badge: badgeOficial,
        countdownDataFim: countdownOficial,
      },
      legado: {
        ativo: legadoAtivo,
        migrado: legadoMigrado,
        migradoEm: preco.legadoPromocaoMigradoEm,
        migradoParaRegraId: preco.legadoPromocaoMigradoParaRegraId,
        precoPromocionalEmCentavos: precoLegado,
        badge: badgeLegado,
        countdownDataFim: countdownLegado,
      },
    } satisfies ItemDiagnosticoOfertaRelampagoAdmin;
  });

  return {
    itens,
    resumo: {
      totalItens: itens.length,
      totalOficiais: itens.filter((item) => item.oficial.ativo).length,
      totalLegados: itens.filter((item) => item.legado.ativo).length,
      totalSemPromocao: itens.filter((item) => item.origem === "sem_promocao")
        .length,
      totalOficiaisValidados: itens.filter(
        (item) => item.status === "oficial_validado",
      ).length,
      totalLegadosMigrados: itens.filter(
        (item) => item.status === "legado_migrado",
      ).length,
      totalUsandoLegado: itens.filter(
        (item) => item.status === "usando_legado" && item.legado.ativo,
      ).length,
      totalDivergentes: itens.filter((item) => item.status === "divergente")
        .length,
    },
    dataReferencia,
  };
}
