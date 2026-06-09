import "server-only";

import { asc, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "../../../db/connection";
import { productPricingTable, productTable } from "../../../db/schema";
import {
  adaptarPrecosVitrine,
  criarChavePrecoVitrine,
} from "../../precificacao";
import { avaliarEstabilidadeMigracaoRelampago } from "../lib/avaliar-estabilidade-migracao-relampago";
import type {
  ItemEstabilidadeMigracaoRelampagoAdmin,
  ResultadoEstabilidadeMigracaoRelampagoAdmin,
} from "../types";

type ProdutoEstabilidadeBanco = typeof productTable.$inferSelect;
type PrecoEstabilidadeBanco = typeof productPricingTable.$inferSelect;

function converterData(data: Date | string | null | undefined) {
  if (!data) return null;

  const dataConvertida = data instanceof Date ? data : new Date(data);

  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function indexarPrecosPorProduto(precos: PrecoEstabilidadeBanco[]) {
  const mapa = new Map<string, PrecoEstabilidadeBanco[]>();

  precos.forEach((preco) => {
    const atuais = mapa.get(preco.productId) ?? [];
    atuais.push(preco);
    mapa.set(preco.productId, atuais);
  });

  return mapa;
}

export async function verificarEstabilidadeMigracaoRelampagoAdmin(): Promise<ResultadoEstabilidadeMigracaoRelampagoAdmin> {
  const dataReferencia = new Date();
  const legadosMigrados = await db
    .select()
    .from(productPricingTable)
    .where(isNotNull(productPricingTable.legadoPromocaoMigradoEm))
    .orderBy(asc(productPricingTable.legadoPromocaoMigradoEm));
  const produtosIds = Array.from(
    new Set(legadosMigrados.map((preco) => preco.productId)),
  );

  if (produtosIds.length === 0) {
    return {
      itens: [],
      resumo: {
        totalItens: 0,
        totalEstaveis: 0,
        totalInstaveis: 0,
        totalPrecisamRevisao: 0,
      },
      dataReferencia,
    };
  }

  const [produtos, precos] = await Promise.all([
    db.select().from(productTable).where(inArray(productTable.id, produtosIds)),
    db
      .select()
      .from(productPricingTable)
      .where(inArray(productPricingTable.productId, produtosIds)),
  ]);
  const produtosPorId = new Map<string, ProdutoEstabilidadeBanco>(
    produtos.map((produto) => [produto.id, produto]),
  );
  const precosPorProduto = indexarPrecosPorProduto(precos);
  const precosVitrine = await adaptarPrecosVitrine(
    produtos.map((produto) => ({
      id: produto.id,
      productKind: produto.productKind,
      pricing: (precosPorProduto.get(produto.id) ?? []).map((preco) => ({
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
      })),
      variants: [],
    })),
  );
  const itens = legadosMigrados.map((precoLegadoMigrado) => {
    const produto = produtosPorId.get(precoLegadoMigrado.productId);
    const chave = criarChavePrecoVitrine(
      precoLegadoMigrado.productId,
      precoLegadoMigrado.type,
    );
    const precoCalculado = precosVitrine.precosPorChave[chave];
    const precoStock =
      precosVitrine.precosPorChave[
        criarChavePrecoVitrine(precoLegadoMigrado.productId, "stock")
      ];
    const countdownLegado = converterData(precoLegadoMigrado.promoEndDate);
    const countdownOficial =
      precoCalculado?.promocaoEngine.countdownPromocionalDataFim ?? null;
    const oficialAtiva = Boolean(
      precoCalculado?.promocaoEngine.ativa &&
        precoCalculado.promocaoEngine.tipoCampanha === "relampago",
    );
    const legadoUsado = Boolean(
      precoCalculado?.promocaoLegadaEngine.ativa ||
        precoCalculado?.origemPromocaoAplicada === "legado",
    );
    const stockSemPromocao =
      precoStock && precoLegadoMigrado.type !== "stock"
        ? !precoStock.possuiPromocao &&
          precoStock.origemPromocaoAplicada === "sem_promocao"
        : null;
    const avaliacao = avaliarEstabilidadeMigracaoRelampago({
      precoCalculadoEncontrado: Boolean(precoCalculado),
      oficialAtiva,
      regraOficialAplicadaId:
        precoCalculado?.promocaoEngine.regraAplicadaId ?? null,
      regraMigradaId: precoLegadoMigrado.legadoPromocaoMigradoParaRegraId,
      modalidadeOficial: precoCalculado?.modalidade ?? null,
      modalidadeMigrada: precoLegadoMigrado.type,
      precoOficialEmCentavos:
        precoCalculado?.promocaoEngine.precoFinalEmCentavos ?? null,
      precoLegadoEmCentavos: precoLegadoMigrado.promoPrice,
      countdownOficialIso: countdownOficial?.toISOString() ?? null,
      countdownLegadoIso: countdownLegado?.toISOString() ?? null,
      legadoUsado,
      stockSemPromocao,
    });

    return {
      chave,
      produtoId: precoLegadoMigrado.productId,
      produto: produto?.name ?? "Produto não encontrado",
      sku: produto?.sku ?? "",
      modalidade: precoLegadoMigrado.type,
      regraPromocaoId: precoLegadoMigrado.legadoPromocaoMigradoParaRegraId,
      status: avaliacao.status,
      motivos: avaliacao.motivos,
      precoLegadoEmCentavos: precoLegadoMigrado.promoPrice,
      precoOficialEmCentavos:
        precoCalculado?.promocaoEngine.precoFinalEmCentavos ?? null,
      countdownLegadoDataFim: countdownLegado,
      countdownOficialDataFim: countdownOficial,
      oficialAtiva,
      legadoMigrado: Boolean(precoLegadoMigrado.legadoPromocaoMigradoEm),
      legadoUsado,
      stockSemPromocao,
      migradoEm: precoLegadoMigrado.legadoPromocaoMigradoEm,
    } satisfies ItemEstabilidadeMigracaoRelampagoAdmin;
  });

  return {
    itens,
    resumo: {
      totalItens: itens.length,
      totalEstaveis: itens.filter((item) => item.status === "estavel").length,
      totalInstaveis: itens.filter((item) => item.status === "instavel").length,
      totalPrecisamRevisao: itens.filter(
        (item) => item.status === "precisa_revisao",
      ).length,
    },
    dataReferencia,
  };
}
