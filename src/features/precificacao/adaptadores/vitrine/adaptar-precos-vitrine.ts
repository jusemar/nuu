import { adaptarPromocoesLegadasParaEngine } from "../../../promocoes/adaptadores";
import { calcularPromocoes } from "../../../promocoes/services";
import type {
  CampanhaPromocionalLegadaAdaptada,
  CountdownPromocionalLegadoAdaptado,
} from "../../../promocoes/types";
import { aplicarPromocoesPrecificacao } from "../../lib/calculos/aplicar-promocoes-precificacao";
import { calcularPrecoProduto } from "../../lib/calculos/calcular-preco-produto";
import { buscarConfiguracaoPagamentoAtiva } from "../../queries/configuracao-pagamento/buscar-configuracao-pagamento-ativa";
import type {
  EntradaPrecificacaoProduto,
  PromocaoPrecificacaoProduto,
} from "../../types/precificacao.types";
import type {
  DependenciasAdaptadorPrecosVitrine,
  OrigemPrecoVitrine,
  OrigemPromocaoVitrine,
  PrecoPrincipalCompatibilidadeVitrine,
  PrecoModalidadeVitrineEntrada,
  PrecosVitrineNormalizados,
  PrecoVitrineNormalizado,
  ProdutoVitrineNormalizado,
  ProdutoVitrinePrecificavel,
  PromocaoLegadaVitrine,
  VarianteVitrineEntrada,
} from "../../types/precos-vitrine.types";

type EntradaVitrinePreparada = {
  entrada: EntradaPrecificacaoProduto;
  origem: OrigemPrecoVitrine;
  varianteId: string | null;
  produtoVariavel: boolean;
  modalidadePrincipal: boolean;
  promocaoLegada: PromocaoLegadaVitrine;
  precoLegado: PrecoModalidadeVitrineEntrada | null;
};

type PromocaoComOrigem = {
  promocao: PromocaoPrecificacaoProduto;
  origem: OrigemPromocaoVitrine;
};

type PromocaoLegadaEnginePorEntrada = {
  entrada: EntradaPrecificacaoProduto;
  promocao: PromocaoPrecificacaoProduto;
  campanha: CampanhaPromocionalLegadaAdaptada | null;
};

export function criarChavePrecoVitrine(produtoId: string, modalidade: string) {
  return `${produtoId}:${modalidade}`;
}

export function criarPrecoPrincipalCompatibilidadeVitrine(
  preco: PrecoVitrineNormalizado | null | undefined,
): PrecoPrincipalCompatibilidadeVitrine | null {
  if (!preco) return null;

  return {
    price: preco.precoOriginalEmCentavos,
    promoPrice: preco.possuiPromocao ? preco.precoFinalEmCentavos : null,
    hasPromo: preco.possuiPromocao,
    type: preco.modalidade,
    precoOriginalEmCentavos: preco.precoOriginalEmCentavos,
    precoFinalEmCentavos: preco.precoFinalEmCentavos,
    percentualOff: preco.percentualOff,
    economiaEmCentavos: preco.economiaEmCentavos,
    origemPromocaoAplicada: preco.origemPromocaoAplicada,
    tipoCampanhaPromocional: preco.tipoCampanhaPromocional,
    badgePromocional: preco.badgePromocional,
    countdownPromocional: preco.countdownPromocional,
    countdownPromocionalDataFim: preco.countdownPromocional.dataFim,
    origem: preco.origem,
    varianteId: preco.varianteId,
  };
}

function criarPromocaoInativa(
  entrada: EntradaPrecificacaoProduto,
): PromocaoPrecificacaoProduto {
  return {
    ativa: false,
    precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
    precoFinalEmCentavos: entrada.precoBaseEmCentavos,
    descontoAplicadoEmCentavos: 0,
    regraAplicadaId: null,
    tipoDesconto: null,
    valorDesconto: 0,
    tipoCampanha: null,
    badgePromocional: null,
    countdownPromocionalDataFim: null,
  };
}

function criarCountdownInativo(): CountdownPromocionalLegadoAdaptado {
  return {
    ativo: false,
    dataFim: null,
  };
}

function converterData(data: Date | string | null | undefined) {
  if (!data) return null;

  const dataConvertida = data instanceof Date ? data : new Date(data);

  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function promocaoLegadaEstaVigente(
  preco: PrecoModalidadeVitrineEntrada,
  dataReferencia: Date,
) {
  if (preco.legadoPromocaoMigradoEm) {
    return false;
  }

  if (!preco.hasPromo || !preco.promoPrice || preco.promoPrice <= 0) {
    return false;
  }

  if (preco.promoType !== "flash") {
    return true;
  }

  const dataFim = converterData(preco.promoEndDate);

  return Boolean(dataFim && dataFim.getTime() > dataReferencia.getTime());
}

function normalizarPromocaoLegada({
  preco,
  precoBaseEmCentavos,
  dataReferencia,
}: {
  preco: PrecoModalidadeVitrineEntrada | null;
  precoBaseEmCentavos: number;
  dataReferencia: Date;
}): PromocaoLegadaVitrine {
  if (!preco || !promocaoLegadaEstaVigente(preco, dataReferencia)) {
    return {
      ativa: false,
      tipo: null,
      precoPromocionalEmCentavos: null,
      descontoAplicadoEmCentavos: 0,
      dataFim: null,
      regraPromocaoId: null,
      tipoCampanha: null,
      badge: null,
      countdown: criarCountdownInativo(),
    };
  }

  const precoPromocionalEmCentavos = Math.max(
    Math.min(preco.promoPrice ?? precoBaseEmCentavos, precoBaseEmCentavos),
    0,
  );
  const descontoAplicadoEmCentavos = Math.max(
    precoBaseEmCentavos - precoPromocionalEmCentavos,
    0,
  );

  return {
    ativa: descontoAplicadoEmCentavos > 0,
    tipo: preco.promoType === "flash" ? "flash" : "normal",
    precoPromocionalEmCentavos,
    descontoAplicadoEmCentavos,
    dataFim: converterData(preco.promoEndDate),
    regraPromocaoId: null,
    tipoCampanha: null,
    badge: null,
    countdown: criarCountdownInativo(),
  };
}

function selecionarPromocaoFinal({
  entrada,
  promocaoLegadaEngine,
  promocaoEngine,
}: {
  entrada: EntradaPrecificacaoProduto;
  promocaoLegadaEngine: PromocaoPrecificacaoProduto;
  promocaoEngine: PromocaoPrecificacaoProduto;
}): PromocaoComOrigem {
  const promocaoInativa = criarPromocaoInativa(entrada);
  const candidatas: PromocaoComOrigem[] = [
    { promocao: promocaoInativa, origem: "sem_promocao" },
    {
      promocao: promocaoLegadaEngine.ativa
        ? promocaoLegadaEngine
        : promocaoInativa,
      origem: promocaoLegadaEngine.ativa ? "legado" : "sem_promocao",
    },
    {
      promocao: promocaoEngine.ativa ? promocaoEngine : promocaoInativa,
      origem: promocaoEngine.ativa ? "promotion_engine" : "sem_promocao",
    },
  ];
  const prioridadeOrigem: Record<OrigemPromocaoVitrine, number> = {
    promotion_engine: 3,
    legado: 2,
    sem_promocao: 1,
  };

  return candidatas.sort((atual, proxima) => {
    if (
      atual.promocao.precoFinalEmCentavos !==
      proxima.promocao.precoFinalEmCentavos
    ) {
      return (
        atual.promocao.precoFinalEmCentavos -
        proxima.promocao.precoFinalEmCentavos
      );
    }

    return (
      proxima.promocao.descontoAplicadoEmCentavos -
        atual.promocao.descontoAplicadoEmCentavos ||
      prioridadeOrigem[proxima.origem] - prioridadeOrigem[atual.origem]
    );
  })[0]!;
}

function calcularPercentualOff({
  precoOriginalEmCentavos,
  descontoAplicadoEmCentavos,
}: {
  precoOriginalEmCentavos: number;
  descontoAplicadoEmCentavos: number;
}) {
  if (precoOriginalEmCentavos <= 0 || descontoAplicadoEmCentavos <= 0) {
    return 0;
  }

  return Math.round(
    (descontoAplicadoEmCentavos / precoOriginalEmCentavos) * 100,
  );
}

function selecionarModalidadePrincipal(
  precos: PrecoModalidadeVitrineEntrada[],
) {
  const precosAtivos = precos.filter((preco) => preco.isActive !== false);

  return (
    precosAtivos.find((preco) => preco.mainCardPrice) ?? precosAtivos[0] ?? null
  );
}

function prepararEntradasModalidades({
  produto,
  dataReferencia,
}: {
  produto: ProdutoVitrinePrecificavel;
  dataReferencia: Date;
}): EntradaVitrinePreparada[] {
  const precos = produto.pricing ?? [];
  const modalidadePrincipal = selecionarModalidadePrincipal(precos);

  return precos
    .filter((preco) => preco.isActive !== false && preco.price > 0)
    .map((preco) => {
      const modalidade = preco.type;
      const entrada = {
        produtoId: produto.id,
        modalidade,
        precoBaseEmCentavos: preco.price,
      };

      return {
        entrada,
        origem: "modalidade",
        varianteId: null,
        produtoVariavel: false,
        modalidadePrincipal: modalidadePrincipal?.type === modalidade,
        precoLegado: preco,
        promocaoLegada: normalizarPromocaoLegada({
          preco,
          precoBaseEmCentavos: preco.price,
          dataReferencia,
        }),
      };
    });
}

function prepararEntradasVariantes({
  produto,
}: {
  produto: ProdutoVitrinePrecificavel;
}): EntradaVitrinePreparada[] {
  return (produto.variants ?? [])
    .filter(
      (variante) => variante.isActive !== false && variante.priceInCents > 0,
    )
    .map((variante: VarianteVitrineEntrada) => ({
      entrada: {
        produtoId: produto.id,
        modalidade: `variant:${variante.id}`,
        precoBaseEmCentavos: variante.priceInCents,
      },
      origem: "variante",
      varianteId: variante.id,
      produtoVariavel: true,
      modalidadePrincipal: Boolean(variante.isActive) && Boolean(variante.id),
      precoLegado: null,
      promocaoLegada: {
        ativa: false,
        tipo: null,
        precoPromocionalEmCentavos: null,
        descontoAplicadoEmCentavos: 0,
        dataFim: null,
        regraPromocaoId: null,
        tipoCampanha: null,
        badge: null,
        countdown: criarCountdownInativo(),
      },
    }));
}

function prepararEntradasVitrine({
  produtos,
  dataReferencia,
}: {
  produtos: ProdutoVitrinePrecificavel[];
  dataReferencia: Date;
}) {
  return produtos.flatMap((produto) => {
    if (produto.productKind === "variable") {
      return prepararEntradasVariantes({ produto });
    }

    return prepararEntradasModalidades({ produto, dataReferencia });
  });
}

async function aplicarPromocoesComFallback({
  entradas,
  aplicarPromocoes,
}: {
  entradas: EntradaPrecificacaoProduto[];
  aplicarPromocoes: NonNullable<
    DependenciasAdaptadorPrecosVitrine["aplicarPromocoes"]
  >;
}) {
  try {
    return await aplicarPromocoes(entradas);
  } catch (error) {
    console.error("Erro ao aplicar promocoes nos precos de vitrine", error);

    return entradas.map((entrada) => ({
      entrada,
      promocao: criarPromocaoInativa(entrada),
    }));
  }
}

function indexarPromocoesPorEntrada(
  promocoes: Awaited<ReturnType<typeof aplicarPromocoesComFallback>>,
) {
  return new Map(
    promocoes.map(({ entrada, promocao }) => [
      criarChavePrecoVitrine(entrada.produtoId, entrada.modalidade),
      promocao,
    ]),
  );
}

function mapearPromocaoLegadaPrecificacao({
  entrada,
  precoFinal,
  desconto,
  regraAplicadaId,
}: {
  entrada: EntradaPrecificacaoProduto;
  precoFinal: number;
  desconto: number;
  regraAplicadaId: string | null;
}): PromocaoPrecificacaoProduto {
  if (desconto <= 0 || !regraAplicadaId) {
    return criarPromocaoInativa(entrada);
  }

  return {
    ativa: true,
    precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
    precoFinalEmCentavos: precoFinal,
    descontoAplicadoEmCentavos: desconto,
    regraAplicadaId,
    tipoDesconto: "valor_fixo",
    valorDesconto: desconto,
    tipoCampanha: null,
    badgePromocional: null,
    countdownPromocionalDataFim: null,
  };
}

function criarCountdownPorCampanhaOficial(
  promocaoEngine: PromocaoPrecificacaoProduto,
): CountdownPromocionalLegadoAdaptado {
  const dataFim = converterData(promocaoEngine.countdownPromocionalDataFim);

  return {
    ativo: Boolean(promocaoEngine.ativa && dataFim),
    dataFim,
  };
}

function promocoesRelampagoSaoEquivalentes({
  promocaoEngine,
  promocaoLegadaEngine,
  promocaoLegada,
}: {
  promocaoEngine: PromocaoPrecificacaoProduto;
  promocaoLegadaEngine: PromocaoPrecificacaoProduto;
  promocaoLegada: PromocaoLegadaVitrine;
}) {
  if (
    !promocaoEngine.ativa ||
    !promocaoLegadaEngine.ativa ||
    promocaoEngine.tipoCampanha !== "relampago" ||
    promocaoLegada.tipoCampanha !== "oferta_relampago"
  ) {
    return false;
  }

  const countdownOficial = converterData(
    promocaoEngine.countdownPromocionalDataFim,
  )?.toISOString();
  const countdownLegado = promocaoLegada.countdown.dataFim?.toISOString();

  return (
    promocaoEngine.precoFinalEmCentavos ===
      promocaoLegadaEngine.precoFinalEmCentavos &&
    promocaoEngine.descontoAplicadoEmCentavos ===
      promocaoLegadaEngine.descontoAplicadoEmCentavos &&
    countdownOficial === countdownLegado
  );
}

function criarEntradasPromocoesLegadas(
  entradasPreparadas: EntradaVitrinePreparada[],
) {
  return entradasPreparadas
    .filter(
      (entradaPreparada) =>
        entradaPreparada.origem === "modalidade" &&
        entradaPreparada.precoLegado,
    )
    .map((entradaPreparada) => ({
      produtoId: entradaPreparada.entrada.produtoId,
      modalidade: entradaPreparada.entrada.modalidade,
      precoBaseEmCentavos: entradaPreparada.entrada.precoBaseEmCentavos,
      hasPromo: entradaPreparada.precoLegado?.hasPromo,
      promoType: entradaPreparada.precoLegado?.promoType,
      promoPrice: entradaPreparada.precoLegado?.promoPrice,
      promoEndDate: entradaPreparada.precoLegado?.promoEndDate,
      legadoPromocaoMigradoEm:
        entradaPreparada.precoLegado?.legadoPromocaoMigradoEm,
      legadoPromocaoMigradoParaRegraId:
        entradaPreparada.precoLegado?.legadoPromocaoMigradoParaRegraId,
      mainCardPrice: entradaPreparada.precoLegado?.mainCardPrice,
    }));
}

async function aplicarPromocoesLegadasComFallback({
  entradasPreparadas,
  dataReferencia,
}: {
  entradasPreparadas: EntradaVitrinePreparada[];
  dataReferencia: Date;
}): Promise<PromocaoLegadaEnginePorEntrada[]> {
  return Promise.all(
    entradasPreparadas.map(async (entradaPreparada) => {
      const { entrada } = entradaPreparada;
      const [entradaLegada] = criarEntradasPromocoesLegadas([entradaPreparada]);

      if (!entradaLegada) {
        return {
          entrada,
          promocao: criarPromocaoInativa(entrada),
          campanha: null,
        };
      }

      try {
        const legadoAdaptado = adaptarPromocoesLegadasParaEngine(
          [entradaLegada],
          {
            dataReferencia,
          },
        );

        if (legadoAdaptado.regras.length === 0) {
          return {
            entrada,
            promocao: criarPromocaoInativa(entrada),
            campanha: null,
          };
        }

        const resultadoLegado = await calcularPromocoes({
          itens: [
            {
              produtoId: entrada.produtoId,
              modalidade: entrada.modalidade,
              quantidade: 1,
              precoBaseEmCentavos: entrada.precoBaseEmCentavos,
            },
          ],
          regras: legadoAdaptado.regras,
          produtosPromocao: legadoAdaptado.produtosPromocao,
          contexto: {
            dataReferencia,
          },
        });
        const item = resultadoLegado.itens[0];

        if (!item) {
          return {
            entrada,
            promocao: criarPromocaoInativa(entrada),
            campanha: legadoAdaptado.campanhas[0] ?? null,
          };
        }

        return {
          entrada,
          promocao: mapearPromocaoLegadaPrecificacao({
            entrada,
            precoFinal: item.preco_final,
            desconto: item.desconto_aplicado,
            regraAplicadaId: item.regra_aplicada,
          }),
          campanha: legadoAdaptado.campanhas[0] ?? null,
        };
      } catch (error) {
        console.error("Erro ao adaptar promocao legada para vitrine", error);

        return {
          entrada,
          promocao: criarPromocaoInativa(entrada),
          campanha: null,
        };
      }
    }),
  );
}

function indexarPromocoesLegadasPorEntrada(
  promocoes: PromocaoLegadaEnginePorEntrada[],
) {
  return new Map(
    promocoes.map(({ entrada, promocao, campanha }) => [
      criarChavePrecoVitrine(entrada.produtoId, entrada.modalidade),
      { promocao, campanha },
    ]),
  );
}

function consolidarPromocaoLegadaVitrine({
  promocaoLegada,
  promocaoLegadaEngine,
  campanha,
}: {
  promocaoLegada: PromocaoLegadaVitrine;
  promocaoLegadaEngine: PromocaoPrecificacaoProduto;
  campanha: CampanhaPromocionalLegadaAdaptada | null;
}): PromocaoLegadaVitrine {
  if (!campanha) {
    return promocaoLegada;
  }

  return {
    ativa: promocaoLegadaEngine.ativa,
    tipo: campanha.tipoPromocaoLegada,
    precoPromocionalEmCentavos: campanha.precoPromocionalEmCentavos,
    descontoAplicadoEmCentavos: promocaoLegadaEngine.descontoAplicadoEmCentavos,
    dataFim: campanha.countdown.dataFim,
    regraPromocaoId: campanha.regraPromocaoId,
    tipoCampanha: campanha.tipoCampanha,
    badge: campanha.badge,
    countdown: campanha.countdown,
  };
}

function resolverMetadadosPromocaoAplicada({
  origemPromocaoAplicada,
  promocaoLegada,
  promocaoEngine,
}: {
  origemPromocaoAplicada: OrigemPromocaoVitrine;
  promocaoLegada: PromocaoLegadaVitrine;
  promocaoEngine: PromocaoPrecificacaoProduto;
}) {
  if (origemPromocaoAplicada === "legado") {
    return {
      tipoCampanhaPromocional: promocaoLegada.tipoCampanha,
      badgePromocional: promocaoLegada.badge,
      countdownPromocional: promocaoLegada.countdown,
    };
  }

  if (origemPromocaoAplicada === "promotion_engine") {
    if (promocaoEngine.tipoCampanha === "relampago") {
      return {
        tipoCampanhaPromocional: "oferta_relampago" as const,
        badgePromocional: "relampago" as const,
        countdownPromocional: criarCountdownPorCampanhaOficial(promocaoEngine),
      };
    }

    return {
      tipoCampanhaPromocional: "promocao_normal" as const,
      badgePromocional: "promocao" as const,
      countdownPromocional: criarCountdownInativo(),
    };
  }

  return {
    tipoCampanhaPromocional: null,
    badgePromocional: null,
    countdownPromocional: criarCountdownInativo(),
  };
}

function selecionarPrecoPrincipalProduto(precos: PrecoVitrineNormalizado[]) {
  const precosPrincipais = precos.filter((preco) => preco.modalidadePrincipal);
  const candidatos = precosPrincipais.length > 0 ? precosPrincipais : precos;

  return (
    [...candidatos].sort((atual, proximo) => {
      if (atual.precoFinalEmCentavos !== proximo.precoFinalEmCentavos) {
        return atual.precoFinalEmCentavos - proximo.precoFinalEmCentavos;
      }

      return atual.precoBaseEmCentavos - proximo.precoBaseEmCentavos;
    })[0] ?? null
  );
}

export async function adaptarPrecosVitrine(
  produtos: ProdutoVitrinePrecificavel[],
  dependencias: DependenciasAdaptadorPrecosVitrine = {},
): Promise<PrecosVitrineNormalizados> {
  if (produtos.length === 0) {
    return {
      precosPorChave: {},
      produtosPorId: {},
    };
  }

  const dataReferencia = new Date();
  const entradasPreparadas = prepararEntradasVitrine({
    produtos,
    dataReferencia,
  });

  if (entradasPreparadas.length === 0) {
    return {
      precosPorChave: {},
      produtosPorId: Object.fromEntries(
        produtos.map((produto) => [
          produto.id,
          {
            produtoId: produto.id,
            produtoVariavel: produto.productKind === "variable",
            precoPrincipal: null,
            precos: [],
          } satisfies ProdutoVitrineNormalizado,
        ]),
      ),
    };
  }

  const buscarConfiguracao =
    dependencias.buscarConfiguracao ?? buscarConfiguracaoPagamentoAtiva;
  const aplicarPromocoes =
    dependencias.aplicarPromocoes ?? aplicarPromocoesPrecificacao;
  const [configuracao, promocoesEngine] = await Promise.all([
    buscarConfiguracao(),
    aplicarPromocoesComFallback({
      entradas: entradasPreparadas.map(({ entrada }) => entrada),
      aplicarPromocoes,
    }),
  ]);
  const promocoesLegadas = await aplicarPromocoesLegadasComFallback({
    entradasPreparadas,
    dataReferencia,
  });
  const promocoesPorEntrada = indexarPromocoesPorEntrada(promocoesEngine);
  const promocoesLegadasPorEntrada =
    indexarPromocoesLegadasPorEntrada(promocoesLegadas);
  const precosNormalizados = entradasPreparadas.map((entradaPreparada) => {
    const { entrada, promocaoLegada } = entradaPreparada;
    const chave = criarChavePrecoVitrine(entrada.produtoId, entrada.modalidade);
    const promocaoEngine =
      promocoesPorEntrada.get(chave) ?? criarPromocaoInativa(entrada);
    const promocaoLegadaAdaptada = promocoesLegadasPorEntrada.get(chave);
    const promocaoLegadaEngine =
      promocaoLegadaAdaptada?.promocao ?? criarPromocaoInativa(entrada);
    const promocaoLegadaConsolidada = consolidarPromocaoLegadaVitrine({
      promocaoLegada,
      promocaoLegadaEngine,
      campanha: promocaoLegadaAdaptada?.campanha ?? null,
    });
    const legadoIgnoradoPorOficial = promocoesRelampagoSaoEquivalentes({
      promocaoEngine,
      promocaoLegadaEngine,
      promocaoLegada: promocaoLegadaConsolidada,
    });
    const promocaoFinal = selecionarPromocaoFinal({
      entrada,
      promocaoLegadaEngine: legadoIgnoradoPorOficial
        ? criarPromocaoInativa(entrada)
        : promocaoLegadaEngine,
      promocaoEngine,
    });
    const precificacao = calcularPrecoProduto({
      entrada: {
        ...entrada,
        promocaoCalculada: promocaoFinal.promocao,
      },
      configuracao,
    });
    const economiaEmCentavos = Math.max(
      precificacao.precoOriginalEmCentavos - precificacao.precoFinalEmCentavos,
      0,
    );
    const metadadosPromocaoAplicada = resolverMetadadosPromocaoAplicada({
      origemPromocaoAplicada: promocaoFinal.origem,
      promocaoLegada: promocaoLegadaConsolidada,
      promocaoEngine,
    });

    return {
      chave,
      produtoId: entrada.produtoId,
      modalidade: entrada.modalidade,
      origem: entradaPreparada.origem,
      varianteId: entradaPreparada.varianteId,
      produtoVariavel: entradaPreparada.produtoVariavel,
      modalidadePrincipal: entradaPreparada.modalidadePrincipal,
      precoBaseEmCentavos: entrada.precoBaseEmCentavos,
      precoOriginalEmCentavos: precificacao.precoOriginalEmCentavos,
      precoFinalEmCentavos: precificacao.precoFinalEmCentavos,
      precoPromocionalLegadoEmCentavos:
        promocaoLegadaConsolidada.precoPromocionalEmCentavos,
      promocaoLegada: promocaoLegadaConsolidada,
      promocaoEngine,
      promocaoLegadaEngine,
      legadoIgnoradoPorOficial,
      legadoPromocaoMigradoEm:
        converterData(entradaPreparada.precoLegado?.legadoPromocaoMigradoEm) ??
        null,
      legadoPromocaoMigradoParaRegraId:
        entradaPreparada.precoLegado?.legadoPromocaoMigradoParaRegraId ?? null,
      origemPromocaoAplicada: promocaoFinal.origem,
      tipoCampanhaPromocional:
        metadadosPromocaoAplicada.tipoCampanhaPromocional,
      badgePromocional: metadadosPromocaoAplicada.badgePromocional,
      countdownPromocional: metadadosPromocaoAplicada.countdownPromocional,
      possuiPromocao: economiaEmCentavos > 0,
      descontoAplicadoEmCentavos: economiaEmCentavos,
      percentualOff: calcularPercentualOff({
        precoOriginalEmCentavos: precificacao.precoOriginalEmCentavos,
        descontoAplicadoEmCentavos: economiaEmCentavos,
      }),
      economiaEmCentavos,
      precificacao,
    } satisfies PrecoVitrineNormalizado;
  });
  const precosPorChave = Object.fromEntries(
    precosNormalizados.map((preco) => [preco.chave, preco]),
  );
  const produtosPorId = Object.fromEntries(
    produtos.map((produto) => {
      const precosProduto = precosNormalizados.filter(
        (preco) => preco.produtoId === produto.id,
      );

      return [
        produto.id,
        {
          produtoId: produto.id,
          produtoVariavel: produto.productKind === "variable",
          precoPrincipal: selecionarPrecoPrincipalProduto(precosProduto),
          precos: precosProduto,
        } satisfies ProdutoVitrineNormalizado,
      ];
    }),
  );

  return {
    precosPorChave,
    produtosPorId,
  };
}
