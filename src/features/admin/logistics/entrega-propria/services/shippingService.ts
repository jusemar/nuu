"use server";

/**
 * SERVICE shippingService - Sistema de Frete em 3 Níveis
 *
 * ⚠️ FUNCIONALIDADE VÁLIDA APENAS PARA ENTREGA PRÓPRIA
 *
 * Implementa a hierarquia de precificação:
 * [1] CEP Específico (exceções) → [2] Bairro em Região → [3] Bairro Avulso → [4] Consulte o vendedor
 *
 * Usa banco de dados real via Drizzle ORM.
 * A diretiva 'use server' garante execução no servidor.
 */
import { and, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { cities } from "@/db/table/logistics/cities/cities";
import type {
  BairroAvulso,
  CepEspecifico,
  NewBairroAvulso,
  NewCepEspecifico,
  NewRegioBairro,
  NewShippingBairroAvulsoSlot,
  NewShippingRegion,
  NewShippingRegionSlot,
  RegioBairro,
  ShippingBairroAvulsoSlot,
  ShippingRegion,
  ShippingRegionSlot,
} from "@/db/table/logistics/entrega-propria";
import {
  bairrosAvulsos,
  cepsEspecificos,
  productOwnDeliveryPrices,
  regioBairros,
  shippingBairroAvulsoSlots,
  shippingRegionCepRanges,
  shippingRegions,
  shippingRegionSlots,
} from "@/db/table/logistics/entrega-propria";
import { states } from "@/db/table/logistics/states/states";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import {
  calcularPromessaEntregaProgramada,
  type PromessaEntregaProgramada,
} from "@/features/logistica/lib/entrega-propria/calcular-promessa-entrega-programada";
import {
  calcularPromessaEntregaPropria,
  type PromessaEntregaPropria,
} from "@/features/logistica/lib/entrega-propria/calcular-promessa-entrega-propria";

const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// Enquanto não existe calendário próprio da Entrega Própria no banco, as duas
// modalidades recebem exatamente a mesma lista operacional de bloqueios.
const DATAS_BLOQUEADAS_ENTREGA_PROPRIA: string[] = [];

function formatCepDisplay(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return cep;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

function normalizarTextoFrete(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * HIERARQUIA DE BUSCA DE FRETE
 *
 * Esta é a função principal que implementa a lógica de 3 níveis.
 * Procura na seguinte ordem:
 * [1] CEP específico (exceção)
 * [2] Bairro em região (padrão)
 * [3] Bairro avulso (isolado)
 * [4] Consulte o vendedor
 *
 * @param cep - CEP com ou sem hífen
 * @param neighborhood - Nome do bairro (padronizado)
 * @param city - Cidade
 * @param state - UF
 * @returns Dados de frete ou erro
 */
export async function getShippingPrice(
  cep: string,
  neighborhood: string,
  city: string,
  state: string,
): Promise<ShippingPriceResult> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const cleanCep = cep.replace(/\D/g, "");

  // [PRÉ-FILTRO 1] Estado ativo?
  const estadoAtivo = await db.query.states.findFirst({
    where: and(eq(states.uf, state), eq(states.isActive, true)),
  });

  if (!estadoAtivo) {
    return {
      found: false,
      message: "Consulte o vendedor",
    };
  }

  // [PRÉ-FILTRO 2] Cidade ativa?
  const cidadesAtivas = await db.query.cities.findMany({
    where: and(eq(cities.stateUf, state), eq(cities.isActive, true)),
  });
  const cidadeAtiva = cidadesAtivas.find(
    (cidade) =>
      normalizarTextoFrete(cidade.name) === normalizarTextoFrete(city),
  );

  if (!cidadeAtiva) {
    return {
      found: false,
      message: "Consulte o vendedor",
    };
  }

  // [1] BUSCA: CEP ESPECÍFICO
  const cepEspecifico = await db.query.cepsEspecificos.findFirst({
    where: and(
      eq(cepsEspecificos.cep, cleanCep),
      eq(cepsEspecificos.isActive, true),
    ),
  });

  if (cepEspecifico) {
    return {
      found: true,
      level: "cep-especifico",
      shippingPrice: cepEspecifico.shippingPrice,
      message: `CEP ${cep} com precificação especial: R$ ${(cepEspecifico.shippingPrice / 100).toFixed(2)}`,
      cep: cepEspecifico.cep,
      neighborhood: cepEspecifico.neighborhood,
      city: cepEspecifico.city,
      state: cepEspecifico.state,
    };
  }

  // [2] BUSCA: FAIXA DE CEP DA REGIÃO
  const faixaRegiao = await db.query.shippingRegionCepRanges.findFirst({
    where: and(
      lte(shippingRegionCepRanges.cepStart, cleanCep),
      gte(shippingRegionCepRanges.cepEnd, cleanCep),
      eq(shippingRegionCepRanges.isActive, true),
    ),
    with: {
      region: true,
    },
  });

  if (
    faixaRegiao?.region?.isActive &&
    faixaRegiao.region.state === state &&
    normalizarTextoFrete(faixaRegiao.region.city) === normalizarTextoFrete(city)
  ) {
    return {
      found: true,
      level: "regiao",
      shippingPrice: faixaRegiao.region.baseShippingPrice,
      message: `${formatCepDisplay(cleanCep)} atendido pela região "${faixaRegiao.region.name}"`,
      region: {
        id: faixaRegiao.region.id,
        name: faixaRegiao.region.name,
        city: faixaRegiao.region.city,
        state: faixaRegiao.region.state,
      },
    };
  }

  // [3] BUSCA: BAIRRO EM REGIÃO
  const regioesComBairroLegado = await db.query.regioBairros.findMany({
    where: eq(regioBairros.neighborhood, neighborhood),
    with: {
      regiao: true,
    },
  });
  const regiaoComBairro = regioesComBairroLegado.find(
    (bairro) =>
      normalizarTextoFrete(bairro.neighborhood) ===
        normalizarTextoFrete(neighborhood) &&
      bairro.regiao.isActive &&
      bairro.regiao.state === state &&
      normalizarTextoFrete(bairro.regiao.city) === normalizarTextoFrete(city),
  );

  if (regiaoComBairro) {
    const slots = await db.query.shippingRegionSlots.findMany({
      where: eq(shippingRegionSlots.regionId, regiaoComBairro.regiao.id),
    });

    return {
      found: true,
      level: "regiao",
      shippingPrice: regiaoComBairro.regiao.baseShippingPrice,
      message: `${neighborhood} atendido pela região "${regiaoComBairro.regiao.name}": R$ ${(regiaoComBairro.regiao.baseShippingPrice / 100).toFixed(2)}`,
      region: {
        id: regiaoComBairro.regiao.id,
        name: regiaoComBairro.regiao.name,
        city: regiaoComBairro.regiao.city,
        state: regiaoComBairro.regiao.state,
      },
      slots: slots.map((slot) => ({
        ...slot,
        dayName: DAY_NAMES[slot.dayOfWeek] || "",
      })),
    };
  }

  // [4] BUSCA: BAIRRO AVULSO
  const bairroAvulso = await db.query.bairrosAvulsos.findFirst({
    where: and(
      eq(bairrosAvulsos.neighborhood, neighborhood),
      eq(bairrosAvulsos.city, city),
      eq(bairrosAvulsos.state, state),
      eq(bairrosAvulsos.isActive, true),
    ),
  });

  if (bairroAvulso) {
    const slots = await db.query.shippingBairroAvulsoSlots.findMany({
      where: eq(shippingBairroAvulsoSlots.bairroAvulsoId, bairroAvulso.id),
    });

    return {
      found: true,
      level: "bairro-avulso",
      shippingPrice: bairroAvulso.baseShippingPrice,
      message: `${neighborhood} atendido como bairro avulso: R$ ${(bairroAvulso.baseShippingPrice / 100).toFixed(2)}`,
      bairro: {
        id: bairroAvulso.id,
        neighborhood: bairroAvulso.neighborhood,
        city: bairroAvulso.city,
        state: bairroAvulso.state,
      },
      slots: slots.map((slot) => ({
        ...slot,
        dayName: DAY_NAMES[slot.dayOfWeek] || "",
      })),
    };
  }

  // [4] NÃO ATENDEMOS
  return {
    found: false,
    message: "Consulte o vendedor",
  };
}

async function buscarPrecoProdutoDestino(params: {
  productId: string;
  destinationType: "region" | "bairro-avulso" | "cep-especifico" | "cidade";
  destinationId: number;
}) {
  const baseWhere = [
    eq(productOwnDeliveryPrices.productId, params.productId),
    eq(productOwnDeliveryPrices.destinationType, params.destinationType),
    eq(productOwnDeliveryPrices.isActive, true),
  ];

  if (params.destinationType === "region") {
    baseWhere.push(eq(productOwnDeliveryPrices.regionId, params.destinationId));
  }

  if (params.destinationType === "bairro-avulso") {
    baseWhere.push(
      eq(productOwnDeliveryPrices.bairroAvulsoId, params.destinationId),
    );
  }

  if (params.destinationType === "cep-especifico") {
    baseWhere.push(
      eq(productOwnDeliveryPrices.cepEspecificoId, params.destinationId),
    );
  }

  if (params.destinationType === "cidade") {
    baseWhere.push(eq(productOwnDeliveryPrices.cityId, params.destinationId));
  }

  return db.query.productOwnDeliveryPrices.findFirst({
    where: and(...baseWhere),
  });
}

async function calcularPromessaDaRegiao(regiaoId: number) {
  const regiao = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, regiaoId),
    with: { slots: true },
  });

  if (!regiao) return null;

  return calcularPromessaEntregaPropria({
    agenda: {
      ativa: regiao.agendaAtiva,
      diasDaSemana: regiao.slots
        .filter((slot) => slot.isActive)
        .map((slot) => slot.dayOfWeek),
      horarioCorte: regiao.horarioCorte,
      periodoInicio: regiao.periodoEntregaInicio,
      periodoFim: regiao.periodoEntregaFim,
    },
    feriados: DATAS_BLOQUEADAS_ENTREGA_PROPRIA,
  });
}

async function calcularProgramadaDaRegra(
  regra: typeof productOwnDeliveryPrices.$inferSelect,
  regiaoId: number,
) {
  if (
    !regra.scheduledDeliveryActive ||
    regra.scheduledDeliveryMinDays === null ||
    regra.scheduledDeliveryPrice === null
  ) {
    return null;
  }

  const regiao = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, regiaoId),
    with: { slots: true },
  });
  if (!regiao) return null;

  const promessa = calcularPromessaEntregaProgramada({
    agenda: {
      ativa: regiao.agendaAtiva,
      diasDaSemana: regiao.slots
        .filter((slot) => slot.isActive)
        .map((slot) => slot.dayOfWeek),
      horarioCorte: regiao.horarioCorte,
    },
    prazoMinimoEmDiasCorridos: regra.scheduledDeliveryMinDays,
    datasBloqueadas: DATAS_BLOQUEADAS_ENTREGA_PROPRIA,
  });

  return promessa
    ? {
        valorEmCentavos: regra.scheduledDeliveryPrice,
        promessa,
      }
    : null;
}

export async function getProductOwnDeliveryPrice(
  productId: string,
  cep: string,
  neighborhood: string,
  city: string,
  state: string,
): Promise<ShippingPriceResult & { pendingEligible?: boolean }> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const cleanCep = cep.replace(/\D/g, "");

  const [estadoAtivo, cidadeAtiva] = await Promise.all([
    db.query.states.findFirst({
      where: and(eq(states.uf, state), eq(states.isActive, true)),
    }),
    db.query.cities.findFirst({
      where: and(
        ilike(cities.name, city),
        eq(cities.stateUf, state),
        eq(cities.isActive, true),
      ),
    }),
  ]);

  if (!estadoAtivo) {
    return {
      found: false,
      message: "Consulte o vendedor",
      pendingEligible: true,
    };
  }

  if (!cidadeAtiva) {
    return {
      found: false,
      message: "Consulte o vendedor",
      pendingEligible: true,
    };
  }

  const buscarPrecoCidade = () =>
    buscarPrecoProdutoDestino({
      productId,
      destinationType: "cidade",
      destinationId: cidadeAtiva.id,
    });

  const faixaRegiao = await db.query.shippingRegionCepRanges.findFirst({
    where: and(
      lte(shippingRegionCepRanges.cepStart, cleanCep),
      gte(shippingRegionCepRanges.cepEnd, cleanCep),
      eq(shippingRegionCepRanges.isActive, true),
    ),
    with: { region: true },
  });
  const faixaRegiaoCompativel =
    faixaRegiao?.region?.isActive &&
    faixaRegiao.region.state === state &&
    normalizarTextoFrete(faixaRegiao.region.city) === normalizarTextoFrete(city)
      ? faixaRegiao
      : null;

  const cepEspecifico = await db.query.cepsEspecificos.findFirst({
    where: and(
      eq(cepsEspecificos.cep, cleanCep),
      eq(cepsEspecificos.isActive, true),
    ),
  });

  if (cepEspecifico) {
    const preco = await buscarPrecoProdutoDestino({
      productId,
      destinationType: "cep-especifico",
      destinationId: cepEspecifico.id,
    });

    if (preco) {
      const promessa = faixaRegiaoCompativel
        ? await calcularPromessaDaRegiao(faixaRegiaoCompativel.region.id)
        : null;
      const entregaProgramada = faixaRegiaoCompativel
        ? await calcularProgramadaDaRegra(
            preco,
            faixaRegiaoCompativel.region.id,
          )
        : null;
      return {
        found: true,
        level: "cep-especifico",
        shippingPrice: preco.shippingPrice,
        deliveryDeadline: promessa?.texto ?? preco.deliveryDeadline ?? null,
        promessaEntrega: promessa,
        entregaProgramada,
        message: `Entrega própria: R$ ${(preco.shippingPrice / 100).toFixed(2)}`,
        cep: cepEspecifico.cep,
        neighborhood: cepEspecifico.neighborhood,
        city: cepEspecifico.city,
        state: cepEspecifico.state,
      };
    }
  }

  // Bairro avulso é mais específico que a região e só é válido quando já
  // existe cobertura ativa para aquele endereço.
  const bairroAvulso = await db.query.bairrosAvulsos.findFirst({
    where: and(
      ilike(bairrosAvulsos.neighborhood, neighborhood),
      ilike(bairrosAvulsos.city, city),
      eq(bairrosAvulsos.state, state),
      eq(bairrosAvulsos.isActive, true),
    ),
  });

  if (bairroAvulso) {
    const preco = await buscarPrecoProdutoDestino({
      productId,
      destinationType: "bairro-avulso",
      destinationId: bairroAvulso.id,
    });

    if (preco) {
      return {
        found: true,
        level: "bairro-avulso",
        shippingPrice: preco.shippingPrice,
        deliveryDeadline: preco.deliveryDeadline ?? null,
        promessaEntrega: null,
        message: `Entrega própria: R$ ${(preco.shippingPrice / 100).toFixed(2)}`,
        bairro: {
          id: bairroAvulso.id,
          neighborhood: bairroAvulso.neighborhood,
          city: bairroAvulso.city,
          state: bairroAvulso.state,
        },
      };
    }
  }

  if (faixaRegiaoCompativel) {
    const preco = await buscarPrecoProdutoDestino({
      productId,
      destinationType: "region",
      destinationId: faixaRegiaoCompativel.region.id,
    });

    if (preco) {
      const promessa = await calcularPromessaDaRegiao(
        faixaRegiaoCompativel.region.id,
      );
      const entregaProgramada = await calcularProgramadaDaRegra(
        preco,
        faixaRegiaoCompativel.region.id,
      );
      return {
        found: true,
        level: "regiao",
        shippingPrice: preco.shippingPrice,
        deliveryDeadline: promessa?.texto ?? preco.deliveryDeadline ?? null,
        promessaEntrega: promessa,
        entregaProgramada,
        message: `Entrega própria: R$ ${(preco.shippingPrice / 100).toFixed(2)}`,
        region: {
          id: faixaRegiaoCompativel.region.id,
          name: faixaRegiaoCompativel.region.name,
          city: faixaRegiaoCompativel.region.city,
          state: faixaRegiaoCompativel.region.state,
        },
      };
    }

    const precoCidade = await buscarPrecoCidade();
    if (precoCidade) {
      const promessa = await calcularPromessaDaRegiao(
        faixaRegiaoCompativel.region.id,
      );
      const entregaProgramada = await calcularProgramadaDaRegra(
        precoCidade,
        faixaRegiaoCompativel.region.id,
      );
      return {
        found: true,
        level: "cidade",
        shippingPrice: precoCidade.shippingPrice,
        deliveryDeadline:
          promessa?.texto ?? precoCidade.deliveryDeadline ?? null,
        promessaEntrega: promessa,
        entregaProgramada,
        message: `Entrega própria: R$ ${(precoCidade.shippingPrice / 100).toFixed(2)}`,
        city,
        state,
      };
    }
    return { found: false, message: "Consulte o vendedor" };
  }

  const regioesComBairro = await db.query.regioBairros.findMany({
    where: eq(regioBairros.neighborhood, neighborhood),
    with: {
      regiao: true,
    },
  });
  const regioesCompativeis = regioesComBairro.filter(
    (bairro) =>
      normalizarTextoFrete(bairro.neighborhood) ===
        normalizarTextoFrete(neighborhood) &&
      bairro.regiao.isActive &&
      bairro.regiao.state === state &&
      normalizarTextoFrete(bairro.regiao.city) === normalizarTextoFrete(city),
  );

  const regionIds = regioesCompativeis.map(
    (regiaoComBairro) => regiaoComBairro.regiao.id,
  );

  if (regionIds.length > 0) {
    const preco = await db.query.productOwnDeliveryPrices.findFirst({
      where: and(
        eq(productOwnDeliveryPrices.productId, productId),
        eq(productOwnDeliveryPrices.destinationType, "region"),
        eq(productOwnDeliveryPrices.isActive, true),
        inArray(productOwnDeliveryPrices.regionId, regionIds),
      ),
    });

    if (preco?.regionId) {
      const regiaoComPreco = regioesCompativeis.find(
        (regiaoComBairro) => regiaoComBairro.regiao.id === preco.regionId,
      );

      if (regiaoComPreco) {
        const promessa = await calcularPromessaDaRegiao(
          regiaoComPreco.regiao.id,
        );
        const entregaProgramada = await calcularProgramadaDaRegra(
          preco,
          regiaoComPreco.regiao.id,
        );
        return {
          found: true,
          level: "regiao",
          shippingPrice: preco.shippingPrice,
          deliveryDeadline: promessa?.texto ?? preco.deliveryDeadline ?? null,
          promessaEntrega: promessa,
          entregaProgramada,
          message: `Entrega própria: R$ ${(preco.shippingPrice / 100).toFixed(2)}`,
          region: {
            id: regiaoComPreco.regiao.id,
            name: regiaoComPreco.regiao.name,
            city: regiaoComPreco.regiao.city,
            state: regiaoComPreco.regiao.state,
          },
        };
      }
    }
  }

  if (regioesCompativeis.length > 0) {
    const precoCidade = await buscarPrecoCidade();
    if (precoCidade) {
      const promessa = await calcularPromessaDaRegiao(
        regioesCompativeis[0].regiao.id,
      );
      const entregaProgramada = await calcularProgramadaDaRegra(
        precoCidade,
        regioesCompativeis[0].regiao.id,
      );
      return {
        found: true,
        level: "cidade",
        shippingPrice: precoCidade.shippingPrice,
        deliveryDeadline:
          promessa?.texto ?? precoCidade.deliveryDeadline ?? null,
        promessaEntrega: promessa,
        entregaProgramada,
        message: `Entrega própria: R$ ${(precoCidade.shippingPrice / 100).toFixed(2)}`,
        city,
        state,
      };
    }
    return { found: false, message: "Consulte o vendedor" };
  }

  if (bairroAvulso) {
    const precoCidade = await buscarPrecoCidade();
    if (!precoCidade) {
      return { found: false, message: "Consulte o vendedor" };
    }

    return {
      found: true,
      level: "cidade",
      shippingPrice: precoCidade.shippingPrice,
      deliveryDeadline: precoCidade.deliveryDeadline ?? null,
      promessaEntrega: null,
      message: `Entrega própria: R$ ${(precoCidade.shippingPrice / 100).toFixed(2)}`,
      bairro: {
        id: bairroAvulso.id,
        neighborhood: bairroAvulso.neighborhood,
        city: bairroAvulso.city,
        state: bairroAvulso.state,
      },
    };
  }

  return {
    found: false,
    message: "Consulte o vendedor",
    pendingEligible: true,
  };
}

export async function getProductsOwnDeliveryForecasts(
  productIds: string[],
  cep: string,
  neighborhood: string,
  city: string,
  state: string,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const ids = [...new Set(productIds)].slice(0, 80);
  const cleanCep = cep.replace(/\D/g, "");
  if (ids.length === 0 || cleanCep.length !== 8) return {};

  const [estadoAtivo, cidadeAtiva, faixaRegiao, cepEspecifico, regioesBairro] =
    await Promise.all([
      db.query.states.findFirst({
        where: and(eq(states.uf, state), eq(states.isActive, true)),
      }),
      db.query.cities.findFirst({
        where: and(
          eq(cities.name, city),
          eq(cities.stateUf, state),
          eq(cities.isActive, true),
        ),
      }),
      db.query.shippingRegionCepRanges.findFirst({
        where: and(
          lte(shippingRegionCepRanges.cepStart, cleanCep),
          gte(shippingRegionCepRanges.cepEnd, cleanCep),
          eq(shippingRegionCepRanges.isActive, true),
        ),
        with: { region: true },
      }),
      db.query.cepsEspecificos.findFirst({
        where: and(
          eq(cepsEspecificos.cep, cleanCep),
          eq(cepsEspecificos.isActive, true),
        ),
      }),
      db.query.regioBairros.findMany({
        where: eq(regioBairros.neighborhood, neighborhood),
        with: { regiao: true },
      }),
    ]);

  if (!estadoAtivo || !cidadeAtiva) return {};

  const faixaCompativel =
    faixaRegiao?.region?.isActive &&
    faixaRegiao.region.state === state &&
    normalizarTextoFrete(faixaRegiao.region.city) === normalizarTextoFrete(city)
      ? faixaRegiao
      : null;
  const regioesCompativeis = regioesBairro.filter(
    (item) =>
      normalizarTextoFrete(item.neighborhood) ===
        normalizarTextoFrete(neighborhood) &&
      item.regiao.isActive &&
      item.regiao.state === state &&
      normalizarTextoFrete(item.regiao.city) === normalizarTextoFrete(city),
  );
  const regionIds = faixaCompativel
    ? [faixaCompativel.region.id]
    : regioesCompativeis.map((item) => item.regiao.id);
  const bairroAvulso =
    !faixaCompativel && regionIds.length === 0
      ? await db.query.bairrosAvulsos.findFirst({
          where: and(
            eq(bairrosAvulsos.neighborhood, neighborhood),
            eq(bairrosAvulsos.city, city),
            eq(bairrosAvulsos.state, state),
            eq(bairrosAvulsos.isActive, true),
          ),
        })
      : null;

  const filtrosDestino = [
    cepEspecifico
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "cep-especifico"),
          eq(productOwnDeliveryPrices.cepEspecificoId, cepEspecifico.id),
        )
      : undefined,
    regionIds.length > 0
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "region"),
          inArray(productOwnDeliveryPrices.regionId, regionIds),
        )
      : undefined,
    bairroAvulso
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "bairro-avulso"),
          eq(productOwnDeliveryPrices.bairroAvulsoId, bairroAvulso.id),
        )
      : undefined,
    cepEspecifico || regionIds.length > 0 || bairroAvulso
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "cidade"),
          eq(productOwnDeliveryPrices.cityId, cidadeAtiva.id),
        )
      : undefined,
  ].filter((filtro) => filtro !== undefined);

  if (filtrosDestino.length === 0) return {};

  const [precos, regioesAgenda] = await Promise.all([
    db.query.productOwnDeliveryPrices.findMany({
      where: and(
        inArray(productOwnDeliveryPrices.productId, ids),
        eq(productOwnDeliveryPrices.isActive, true),
        or(...filtrosDestino),
      ),
    }),
    regionIds.length > 0
      ? db.query.shippingRegions.findMany({
          where: inArray(shippingRegions.id, regionIds),
          with: { slots: true },
        })
      : Promise.resolve([]),
  ]);

  const promessasPorRegiao = new Map(
    regioesAgenda.map((regiao) => [
      regiao.id,
      calcularPromessaEntregaPropria({
        agenda: {
          ativa: regiao.agendaAtiva,
          diasDaSemana: regiao.slots
            .filter((slot) => slot.isActive)
            .map((slot) => slot.dayOfWeek),
          horarioCorte: regiao.horarioCorte,
          periodoInicio: regiao.periodoEntregaInicio,
          periodoFim: regiao.periodoEntregaFim,
        },
        feriados: DATAS_BLOQUEADAS_ENTREGA_PROPRIA,
      }),
    ]),
  );

  return Object.fromEntries(
    ids.flatMap((productId) => {
      const precoCep = cepEspecifico
        ? precos.find(
            (preco) =>
              preco.productId === productId &&
              preco.destinationType === "cep-especifico" &&
              preco.cepEspecificoId === cepEspecifico.id,
          )
        : null;
      const precoRegiao = precos.find(
        (preco) =>
          preco.productId === productId &&
          preco.destinationType === "region" &&
          preco.regionId !== null &&
          regionIds.includes(preco.regionId),
      );
      const precoBairro = bairroAvulso
        ? precos.find(
            (preco) =>
              preco.productId === productId &&
              preco.destinationType === "bairro-avulso" &&
              preco.bairroAvulsoId === bairroAvulso.id,
          )
        : null;
      const precoCidade = precos.find(
        (preco) =>
          preco.productId === productId &&
          preco.destinationType === "cidade" &&
          preco.cityId === cidadeAtiva.id,
      );

      // Mantém a mesma prioridade do fluxo unitário. Faixa regional encontrada
      // sem preço não cai para bairro ou outra modalidade.
      const regiaoPromessaId = precoCep
        ? faixaCompativel?.region.id
        : (precoRegiao?.regionId ?? (precoCidade ? regionIds[0] : undefined));
      const precoValido = precoCep ?? precoBairro ?? precoRegiao ?? precoCidade;
      const promessa = regiaoPromessaId
        ? promessasPorRegiao.get(regiaoPromessaId)
        : null;

      return precoValido && promessa ? [[productId, promessa.texto]] : [];
    }),
  ) as Record<string, string>;
}

/**
 * OPERAÇÕES DE LEITURA - REGIÕES
 */

export async function getRegions() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const regions = await db.query.shippingRegions.findMany({
    orderBy: shippingRegions.name,
    with: {
      bairros: true,
      slots: true,
    },
  });

  return regions.map((region) => ({
    ...region,
    slots: region.slots.map((slot) => ({
      ...slot,
      dayName: DAY_NAMES[slot.dayOfWeek] || "",
    })),
  }));
}

export async function getRegionById(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const region = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, parseInt(id)),
    with: {
      bairros: true,
      slots: true,
    },
  });

  if (!region) return null;

  return {
    ...region,
    slots: region.slots.map((slot) => ({
      ...slot,
      dayName: DAY_NAMES[slot.dayOfWeek] || "",
    })),
  };
}

export async function getBairrosAvulsos() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db.query.bairrosAvulsos.findMany({
    orderBy: bairrosAvulsos.neighborhood,
    with: {
      slots: true,
    },
  });
}

export async function getBairroAvulsoById(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db.query.bairrosAvulsos.findFirst({
    where: eq(bairrosAvulsos.id, parseInt(id)),
    with: {
      slots: true,
    },
  });
}

export async function getCepsEspecificos() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db.query.cepsEspecificos.findMany({
    orderBy: cepsEspecificos.cep,
  });
}

/**
 * OPERAÇÕES DE CRIAÇÃO - REGIÕES
 */

export async function createRegion(data: {
  name: string;
  description?: string;
  city: string;
  state: string;
  baseShippingPrice: number;
  bairros: string[];
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const [newRegion] = await db
    .insert(shippingRegions)
    .values({
      name: data.name,
      description: data.description,
      city: data.city,
      state: data.state,
      baseShippingPrice: data.baseShippingPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Insere bairros
  if (data.bairros.length > 0) {
    await db.insert(regioBairros).values(
      data.bairros.map((bairro) => ({
        regiaoId: newRegion.id,
        neighborhood: bairro,
      })),
    );
  }

  // Insere slots
  if (data.slots.length > 0) {
    await db.insert(shippingRegionSlots).values(
      data.slots.map((slot) => ({
        regionId: newRegion.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      })),
    );
  }

  return getRegionById(newRegion.id.toString());
}

export async function updateRegion(
  id: string,
  data: {
    name?: string;
    description?: string;
    city?: string;
    state?: string;
    baseShippingPrice?: number;
    isActive?: boolean;
    bairros?: string[];
    slots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  },
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const regionId = parseInt(id);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.baseShippingPrice !== undefined)
    updateData.baseShippingPrice = data.baseShippingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(shippingRegions)
    .set(updateData)
    .where(eq(shippingRegions.id, regionId));

  // Atualizar bairros se fornecidos
  if (data.bairros !== undefined) {
    await db.delete(regioBairros).where(eq(regioBairros.regiaoId, regionId));
    if (data.bairros.length > 0) {
      await db.insert(regioBairros).values(
        data.bairros.map((bairro) => ({
          regiaoId: regionId,
          neighborhood: bairro,
        })),
      );
    }
  }

  // Atualizar slots se fornecidos
  if (data.slots !== undefined) {
    await db
      .delete(shippingRegionSlots)
      .where(eq(shippingRegionSlots.regionId, regionId));
    if (data.slots.length > 0) {
      await db.insert(shippingRegionSlots).values(
        data.slots.map((slot) => ({
          regionId: regionId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        })),
      );
    }
  }

  return getRegionById(id);
}

export async function toggleRegion(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const regionId = parseInt(id);

  const region = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, regionId),
  });

  if (!region) throw new Error("Região não encontrada");

  await db
    .update(shippingRegions)
    .set({ isActive: !region.isActive, updatedAt: new Date() })
    .where(eq(shippingRegions.id, regionId));

  return getRegionById(id);
}

export async function deleteRegion(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const regionId = parseInt(id);
  await db.delete(shippingRegions).where(eq(shippingRegions.id, regionId));
}

/**
 * OPERAÇÕES DE CRIAÇÃO - BAIRROS AVULSOS
 */

export async function createBairroAvulso(data: {
  neighborhood: string;
  city: string;
  state: string;
  baseShippingPrice: number;
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const [newBairro] = await db
    .insert(bairrosAvulsos)
    .values({
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      baseShippingPrice: data.baseShippingPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (data.slots.length > 0) {
    await db.insert(shippingBairroAvulsoSlots).values(
      data.slots.map((slot) => ({
        bairroAvulsoId: newBairro.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      })),
    );
  }

  return getBairroAvulsoById(newBairro.id.toString());
}

export async function updateBairroAvulso(
  id: string,
  data: {
    neighborhood?: string;
    city?: string;
    state?: string;
    baseShippingPrice?: number;
    isActive?: boolean;
    slots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  },
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const bairroId = parseInt(id);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.neighborhood !== undefined)
    updateData.neighborhood = data.neighborhood;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.baseShippingPrice !== undefined)
    updateData.baseShippingPrice = data.baseShippingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(bairrosAvulsos)
    .set(updateData)
    .where(eq(bairrosAvulsos.id, bairroId));

  // Atualizar slots se fornecidos
  if (data.slots !== undefined) {
    await db
      .delete(shippingBairroAvulsoSlots)
      .where(eq(shippingBairroAvulsoSlots.bairroAvulsoId, bairroId));
    if (data.slots.length > 0) {
      await db.insert(shippingBairroAvulsoSlots).values(
        data.slots.map((slot) => ({
          bairroAvulsoId: bairroId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        })),
      );
    }
  }

  return getBairroAvulsoById(id);
}

export async function toggleBairroAvulso(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const bairroId = parseInt(id);

  const bairro = await db.query.bairrosAvulsos.findFirst({
    where: eq(bairrosAvulsos.id, bairroId),
  });

  if (!bairro) throw new Error("Bairro avulso não encontrado");

  await db
    .update(bairrosAvulsos)
    .set({ isActive: !bairro.isActive, updatedAt: new Date() })
    .where(eq(bairrosAvulsos.id, bairroId));

  return getBairroAvulsoById(id);
}

export async function deleteBairroAvulso(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const bairroId = parseInt(id);
  await db.delete(bairrosAvulsos).where(eq(bairrosAvulsos.id, bairroId));
}

/**
 * OPERAÇÕES DE CRIAÇÃO - CEPs ESPECÍFICOS
 */

export async function createCepEspecifico(data: {
  cep: string;
  neighborhood: string;
  city: string;
  state: string;
  shippingPrice: number;
}) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const cleanCep = data.cep.replace(/\D/g, "");

  const [newCep] = await db
    .insert(cepsEspecificos)
    .values({
      cep: cleanCep,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      shippingPrice: data.shippingPrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newCep;
}

export async function updateCepEspecifico(
  id: string,
  data: {
    shippingPrice?: number;
    isActive?: boolean;
  },
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const cepId = parseInt(id);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.shippingPrice !== undefined)
    updateData.shippingPrice = data.shippingPrice;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(cepsEspecificos)
    .set(updateData)
    .where(eq(cepsEspecificos.id, cepId));

  return db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, cepId),
  });
}

export async function toggleCepEspecifico(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const cepId = parseInt(id);

  const cep = await db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, cepId),
  });

  if (!cep) throw new Error("CEP específico não encontrado");

  await db
    .update(cepsEspecificos)
    .set({ isActive: !cep.isActive, updatedAt: new Date() })
    .where(eq(cepsEspecificos.id, cepId));

  return db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, cepId),
  });
}

export async function deleteCepEspecifico(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const cepId = parseInt(id);
  await db.delete(cepsEspecificos).where(eq(cepsEspecificos.id, cepId));
}

/**
 * TIPOS RETORNADOS
 */

export type ShippingPriceResult =
  | {
      found: true;
      level: "cep-especifico" | "regiao" | "bairro-avulso" | "cidade";
      shippingPrice: number;
      deliveryDeadline?: string | null;
      promessaEntrega?: PromessaEntregaPropria | null;
      entregaProgramada?: {
        valorEmCentavos: number;
        promessa: PromessaEntregaProgramada;
      } | null;
      message: string;
      cep?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      region?: {
        id: number;
        name: string;
        city: string;
        state: string;
      };
      bairro?: {
        id: number;
        neighborhood: string;
        city: string;
        state: string;
      };
      slots?: Array<
        | (ShippingRegionSlot & { dayName: string })
        | (ShippingBairroAvulsoSlot & { dayName: string })
      >;
    }
  | {
      found: false;
      message: string;
    };

/**
 * SERVER ACTIONS PARA DROPDOWNS DE ESTADO/CIDADE
 */

export type EstadoDropdown = {
  uf: string;
  name: string;
};

export async function getEstadosAtivos(): Promise<EstadoDropdown[]> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const data = await db.query.states.findMany({
    where: eq(states.isActive, true),
    orderBy: (states, { asc }) => [asc(states.name)],
    columns: {
      uf: true,
      name: true,
    },
  });

  return data.map((s) => ({ uf: s.uf, name: s.name }));
}

export type CidadeDropdown = {
  id: number;
  name: string;
};

export async function getCidadesAtivasPorEstado(
  stateUf: string,
): Promise<CidadeDropdown[]> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const data = await db.query.cities.findMany({
    where: and(eq(cities.stateUf, stateUf), eq(cities.isActive, true)),
    orderBy: (cities, { asc }) => [asc(cities.name)],
    columns: {
      id: true,
      name: true,
    },
  });

  return data.map((c) => ({ id: c.id, name: c.name }));
}
