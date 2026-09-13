"use server";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { cities } from "@/db/table/logistics/cities/cities";
import {
  agendasGeograficasEntregaPropria,
  bairrosEntregaPropria,
  cepsEspecificos,
  productOwnDeliveryPrices,
  shippingPendingNeighborhoods,
  shippingRegionCepRanges,
  shippingRegions,
  shippingZipAddresses,
} from "@/db/table/logistics/entrega-propria";
import { states } from "@/db/table/logistics/states/states";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { normalizarLocalidadeEntregaPropria } from "@/features/logistica/lib/entrega-propria/normalizar-localidade-entrega-propria";

import { gerarFaixasContiguasDeCeps } from "../lib/cep-ranges";
import {
  type EntregaPropriaDestinoProduto,
  montarDestinosEntregaPropria,
} from "../lib/montar-destinos-entrega-propria";

export type { EntregaPropriaDestinoProduto };

export type EntregaPropriaEstadoResumo = {
  uf: string;
  name: string;
  isActive: boolean;
  cidadesCount: number;
  regioesCount: number;
};

export type EntregaPropriaCidadeResumo = {
  id: number;
  name: string;
  stateUf: string;
  isActive: boolean;
  regioesCount: number;
  bairrosEmRegioesCount: number;
  bairrosPendentesCount: number;
};

export type EntregaPropriaRegiaoResumo = {
  id: number;
  name: string;
  description: string | null;
  city: string;
  state: string;
  isActive: boolean;
  bairrosCount: number;
  createdAt: Date;
};

export type EntregaPropriaBairroRegiao = {
  id: number;
  neighborhood: string;
  cepsCount: number;
  ceps: {
    cep: string;
    street: string;
  }[];
  cepRanges: {
    cepStart: string;
    cepEnd: string;
  }[];
};

export type EntregaPropriaBairroBaseLocal = {
  neighborhood: string;
  cepsCount: number;
  vinculado: boolean;
};

export type EntregaPropriaFaixaCepRegiao = {
  id: number;
  cepStart: string;
  cepEnd: string;
  source: string;
  isActive: boolean;
};

export type EntregaPropriaBairroPendente = {
  id: number;
  lastCep: string;
  neighborhood: string;
  city: string;
  state: string;
  consultationCount: number;
  lastConsultedAt: Date;
};

export type EntregaPropriaRegiaoDetalhe = EntregaPropriaRegiaoResumo & {
  bairros: EntregaPropriaBairroRegiao[];
  bairrosBaseLocal: EntregaPropriaBairroBaseLocal[];
  cepRanges: EntregaPropriaFaixaCepRegiao[];
  bairrosPendentes: EntregaPropriaBairroPendente[];
  bairrosPendentesIndisponiveis: boolean;
};

export type EntregaPropriaPrecoProduto = {
  id: number;
  destinationType: "region" | "bairro" | "cep-especifico" | "cidade";
  destinationId: number;
  destinationLabel: string;
  city: string;
  state: string;
  shippingPrice: number;
  rapidDeliveryActive: boolean;
  deliveryDeadline: string | null;
  scheduledDeliveryActive: boolean;
  scheduledDeliveryMinDays: number | null;
  scheduledDeliveryPrice: number | null;
  isActive: boolean;
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function detalharErroBanco(erro: unknown) {
  const principal = erro instanceof Error ? erro : new Error(String(erro));
  const causa = principal.cause;
  const causaRegistro =
    causa && typeof causa === "object"
      ? (causa as Record<string, unknown>)
      : null;

  return {
    nome: principal.name,
    mensagem: principal.message,
    causa: causaRegistro
      ? {
          nome: causaRegistro.name,
          mensagem: causaRegistro.message,
          codigo: causaRegistro.code,
          detalhe: causaRegistro.detail,
        }
      : causa
        ? String(causa)
        : null,
  };
}

function erroBancoTransitorio(erro: unknown) {
  const detalhes = JSON.stringify(detalharErroBanco(erro));
  return /EAI_AGAIN|ECONNRESET|ETIMEDOUT|fetch failed|Failed to fetch/i.test(
    detalhes,
  );
}

async function buscarBairrosPendentesDaRegiao(state: string, city: string) {
  const consultar = () =>
    db.query.shippingPendingNeighborhoods.findMany({
      where: and(
        eq(shippingPendingNeighborhoods.state, state),
        eq(shippingPendingNeighborhoods.city, city),
        eq(shippingPendingNeighborhoods.status, "pending"),
      ),
      orderBy: (shippingPendingNeighborhoods, { desc }) => [
        desc(shippingPendingNeighborhoods.consultationCount),
        desc(shippingPendingNeighborhoods.lastConsultedAt),
      ],
    });

  try {
    return { dados: await consultar(), indisponiveis: false };
  } catch (erro) {
    if (erroBancoTransitorio(erro)) {
      try {
        return { dados: await consultar(), indisponiveis: false };
      } catch (erroRepetido) {
        console.error("[entrega-propria] bairros pendentes indisponíveis", {
          state,
          city,
          erro: detalharErroBanco(erroRepetido),
        });
        return { dados: [], indisponiveis: true };
      }
    }

    // Erros estruturais não derrubam a região, mas ficam explícitos no log e
    // na interface para não serem confundidos com uma lista realmente vazia.
    console.error("[entrega-propria] falha estrutural em bairros pendentes", {
      state,
      city,
      erro: detalharErroBanco(erro),
    });
    return { dados: [], indisponiveis: true };
  }
}

async function listarNomesBairrosVinculadosNaCidade(
  cidadeId: number,
): Promise<Set<string>> {
  const bairrosVinculados = await db.query.bairrosEntregaPropria.findMany({
    where: and(
      eq(bairrosEntregaPropria.cidadeId, cidadeId),
      eq(bairrosEntregaPropria.ativo, true),
    ),
    columns: { nomeNormalizado: true },
  });

  return new Set(bairrosVinculados.map((bairro) => bairro.nomeNormalizado));
}

export async function listarEstadosEntregaPropria(): Promise<
  EntregaPropriaEstadoResumo[]
> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const estados = await db.query.states.findMany({
    orderBy: (states, { asc }) => [asc(states.name)],
  });

  return Promise.all(
    estados.map(async (estado) => {
      const [cidadesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cities)
        .where(eq(cities.stateUf, estado.uf));

      const [regioesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(shippingRegions)
        .where(eq(shippingRegions.state, estado.uf));

      return {
        uf: estado.uf,
        name: estado.name,
        isActive: estado.isActive,
        cidadesCount: toNumber(cidadesResult?.count),
        regioesCount: toNumber(regioesResult?.count),
      };
    }),
  );
}

export async function buscarNomeEstadoEntregaPropria(
  uf: string,
): Promise<string | null> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const estado = await db.query.states.findFirst({
    where: eq(states.uf, uf),
    columns: {
      name: true,
    },
  });

  return estado?.name ?? null;
}

export async function listarCidadesEntregaPropria(
  stateUf: string,
): Promise<EntregaPropriaCidadeResumo[]> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const cidades = await db.query.cities.findMany({
    where: eq(cities.stateUf, stateUf),
    orderBy: (cities, { asc }) => [asc(cities.name)],
  });

  return Promise.all(
    cidades.map(async (cidade) => {
      const [regioesResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(shippingRegions)
        .where(
          and(
            eq(shippingRegions.state, cidade.stateUf),
            eq(shippingRegions.city, cidade.name),
          ),
        );

      const [bairrosRegiaoResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bairrosEntregaPropria)
        .where(
          and(
            eq(bairrosEntregaPropria.cidadeId, cidade.id),
            sql`${bairrosEntregaPropria.regiaoId} IS NOT NULL`,
            eq(bairrosEntregaPropria.ativo, true),
          ),
        );

      const bairrosPendentesCidade =
        await db.query.shippingPendingNeighborhoods.findMany({
          where: and(
            eq(shippingPendingNeighborhoods.state, cidade.stateUf),
            eq(shippingPendingNeighborhoods.city, cidade.name),
            eq(shippingPendingNeighborhoods.status, "pending"),
          ),
          columns: {
            id: true,
          },
        });
      return {
        id: cidade.id,
        name: cidade.name,
        stateUf: cidade.stateUf,
        isActive: cidade.isActive,
        regioesCount: toNumber(regioesResult?.count),
        bairrosEmRegioesCount: toNumber(bairrosRegiaoResult?.count),
        bairrosPendentesCount: bairrosPendentesCidade.length,
      };
    }),
  );
}

export async function listarRegioesEntregaPropriaPorCidade(
  stateUf: string,
  city: string,
): Promise<EntregaPropriaRegiaoResumo[]> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const regioes = await db.query.shippingRegions.findMany({
    where: and(
      eq(shippingRegions.state, stateUf),
      eq(shippingRegions.city, city),
    ),
    orderBy: (shippingRegions, { asc }) => [asc(shippingRegions.name)],
  });

  return Promise.all(
    regioes.map(async (regiao) => {
      const [bairros] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bairrosEntregaPropria)
        .where(
          and(
            eq(bairrosEntregaPropria.regiaoId, regiao.id),
            eq(bairrosEntregaPropria.ativo, true),
          ),
        );
      return {
        id: regiao.id,
        name: regiao.name,
        description: regiao.description,
        city: regiao.city,
        state: regiao.state,
        isActive: regiao.isActive,
        bairrosCount: toNumber(bairros?.count),
        createdAt: regiao.createdAt,
      };
    }),
  );
}

export async function buscarRegiaoEntregaPropriaDetalhe(
  id: number,
): Promise<EntregaPropriaRegiaoDetalhe | null> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const regiao = await db.query.shippingRegions.findFirst({
    where: eq(shippingRegions.id, id),
  });

  if (!regiao) return null;

  const bairrosPendentesResultado = await buscarBairrosPendentesDaRegiao(
    regiao.state,
    regiao.city,
  );
  const bairrosPendentes = bairrosPendentesResultado.dados;
  const bairros = await db.query.bairrosEntregaPropria.findMany({
    where: and(
      eq(bairrosEntregaPropria.regiaoId, regiao.id),
      eq(bairrosEntregaPropria.ativo, true),
    ),
    orderBy: (bairrosEntregaPropria, { asc }) => [
      asc(bairrosEntregaPropria.nome),
    ],
  });
  const cepRanges = await db.query.shippingRegionCepRanges.findMany({
    where: eq(shippingRegionCepRanges.regionId, regiao.id),
    orderBy: (shippingRegionCepRanges, { asc }) => [
      asc(shippingRegionCepRanges.cepStart),
    ],
  });
  const bairrosVinculados = bairros.map((bairro) => bairro.nome);
  const cepsPorBairro =
    bairrosVinculados.length > 0
      ? await db.query.shippingZipAddresses.findMany({
          where: and(
            eq(shippingZipAddresses.state, regiao.state),
            eq(shippingZipAddresses.city, regiao.city),
            inArray(shippingZipAddresses.neighborhood, bairrosVinculados),
          ),
          columns: {
            cep: true,
            neighborhood: true,
            street: true,
          },
          orderBy: (shippingZipAddresses, { asc }) => [
            asc(shippingZipAddresses.neighborhood),
            asc(shippingZipAddresses.cep),
          ],
        })
      : [];
  const cepsAgrupadosPorBairro = new Map<
    string,
    { cep: string; street: string }[]
  >();

  cepsPorBairro.forEach((address) => {
    const bairroCeps = cepsAgrupadosPorBairro.get(address.neighborhood) ?? [];
    bairroCeps.push({
      cep: address.cep,
      street: address.street,
    });
    cepsAgrupadosPorBairro.set(address.neighborhood, bairroCeps);
  });
  const bairrosVinculadosNaCidade = await listarNomesBairrosVinculadosNaCidade(
    regiao.cityId,
  );
  const bairrosBaseLocal = await db
    .select({
      neighborhood: shippingZipAddresses.neighborhood,
      cepsCount: sql<number>`count(*)`,
    })
    .from(shippingZipAddresses)
    .where(
      and(
        eq(shippingZipAddresses.state, regiao.state),
        eq(shippingZipAddresses.city, regiao.city),
      ),
    )
    .groupBy(shippingZipAddresses.neighborhood)
    .orderBy(shippingZipAddresses.neighborhood);

  return {
    id: regiao.id,
    name: regiao.name,
    description: regiao.description,
    city: regiao.city,
    state: regiao.state,
    isActive: regiao.isActive,
    bairrosCount: bairros.length,
    createdAt: regiao.createdAt,
    bairros: bairros.map((bairro) => {
      const ceps = cepsAgrupadosPorBairro.get(bairro.nome) ?? [];

      return {
        id: bairro.id,
        neighborhood: bairro.nome,
        cepsCount: ceps.length,
        ceps,
        cepRanges: gerarFaixasContiguasDeCeps(
          ceps.map((address) => address.cep),
        ),
      };
    }),
    bairrosBaseLocal: bairrosBaseLocal.map((bairro) => ({
      neighborhood: bairro.neighborhood,
      cepsCount: toNumber(bairro.cepsCount),
      vinculado: bairrosVinculadosNaCidade.has(
        normalizarLocalidadeEntregaPropria(bairro.neighborhood),
      ),
    })),
    cepRanges: cepRanges.map((range) => ({
      id: range.id,
      cepStart: range.cepStart,
      cepEnd: range.cepEnd,
      source: range.source,
      isActive: range.isActive,
    })),
    bairrosPendentes: bairrosPendentes
      .filter(
        (bairro) =>
          !bairrosVinculadosNaCidade.has(
            normalizarLocalidadeEntregaPropria(bairro.neighborhood),
          ),
      )
      .map((bairro) => ({
        id: bairro.id,
        lastCep: bairro.lastCep,
        neighborhood: bairro.neighborhood,
        city: bairro.city,
        state: bairro.state,
        consultationCount: bairro.consultationCount,
        lastConsultedAt: bairro.lastConsultedAt,
      })),
    bairrosPendentesIndisponiveis: bairrosPendentesResultado.indisponiveis,
  };
}

export async function listarDestinosEntregaPropriaProduto(): Promise<
  EntregaPropriaDestinoProduto[]
> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const [cidades, regioes, bairros, ceps, agendas] = await Promise.all([
    db.query.cities.findMany({
      where: eq(cities.isActive, true),
      orderBy: (cities, { asc }) => [asc(cities.stateUf), asc(cities.name)],
    }),
    db.query.shippingRegions.findMany({
      orderBy: (shippingRegions, { asc }) => [
        asc(shippingRegions.state),
        asc(shippingRegions.city),
        asc(shippingRegions.name),
      ],
      where: eq(shippingRegions.isActive, true),
      with: { cepRanges: true },
    }),
    db.query.bairrosEntregaPropria.findMany({
      where: eq(bairrosEntregaPropria.ativo, true),
      orderBy: (bairrosEntregaPropria, { asc }) => [
        asc(bairrosEntregaPropria.cidadeId),
        asc(bairrosEntregaPropria.nome),
      ],
      with: { cidade: true, regiao: true },
    }),
    db.query.cepsEspecificos.findMany({
      where: eq(cepsEspecificos.isActive, true),
      orderBy: (cepsEspecificos, { asc }) => [
        asc(cepsEspecificos.state),
        asc(cepsEspecificos.city),
        asc(cepsEspecificos.cep),
      ],
    }),
    db.query.agendasGeograficasEntregaPropria.findMany({
      where: eq(agendasGeograficasEntregaPropria.ativa, true),
    }),
  ]);

  // Bairro do endereço cadastrado de cada CEP específico: é o mesmo dado que
  // a cotação pública usa para identificar o bairro do cliente.
  const enderecosCeps =
    ceps.length > 0
      ? await db.query.shippingZipAddresses.findMany({
          where: inArray(
            shippingZipAddresses.cep,
            ceps.map((cep) => cep.cep),
          ),
          columns: { cep: true, neighborhood: true },
        })
      : [];
  const bairroPorCep = new Map(
    enderecosCeps.map((endereco) => [endereco.cep, endereco.neighborhood]),
  );

  return montarDestinosEntregaPropria({
    cidades,
    regioes,
    bairros,
    ceps: ceps.map((cep) => ({
      ...cep,
      bairroEnderecoCadastrado: bairroPorCep.get(cep.cep) ?? null,
    })),
    agendas,
  });
}

export async function listarPrecosEntregaPropriaProduto(
  productId: string,
): Promise<EntregaPropriaPrecoProduto[]> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const precos = await db.query.productOwnDeliveryPrices.findMany({
    where: eq(productOwnDeliveryPrices.productId, productId),
    orderBy: (productOwnDeliveryPrices, { asc }) => [
      asc(productOwnDeliveryPrices.destinationType),
      asc(productOwnDeliveryPrices.id),
    ],
    with: {
      region: true,
      bairro: { with: { cidade: true } },
      cepEspecifico: true,
      cidade: true,
    },
  });

  return precos.map((preco) => {
    const cidadeRelacionada = preco.cidade;
    const cidadeId = preco.cityId;
    const destino =
      preco.destinationType === "region"
        ? preco.region
        : preco.destinationType === "bairro" ||
            preco.destinationType === "bairro-avulso"
          ? preco.bairro
          : preco.destinationType === "cidade"
            ? cidadeRelacionada
            : preco.cepEspecifico;

    const destinationId =
      preco.destinationType === "region"
        ? preco.regionId
        : preco.destinationType === "bairro" ||
            preco.destinationType === "bairro-avulso"
          ? preco.bairroId
          : preco.destinationType === "cidade"
            ? cidadeId
            : preco.cepEspecificoId;

    return {
      id: preco.id,
      destinationType:
        preco.destinationType === "bairro-avulso"
          ? "bairro"
          : (preco.destinationType as
              | "region"
              | "bairro"
              | "cep-especifico"
              | "cidade"),
      destinationId: destinationId ?? 0,
      destinationLabel:
        preco.destinationType === "cidade" && cidadeRelacionada
          ? cidadeRelacionada.name
          : preco.destinationType === "cep-especifico" && preco.cepEspecifico
            ? `${preco.cepEspecifico.cep.slice(0, 5)}-${preco.cepEspecifico.cep.slice(5)} - ${preco.cepEspecifico.neighborhood}`
            : (destino as { name?: string; nome?: string } | null)?.name ||
              (destino as { name?: string; nome?: string } | null)?.nome ||
              "Destino removido",
      city:
        preco.destinationType === "cidade" && cidadeRelacionada
          ? cidadeRelacionada.name
          : (preco.destinationType === "bairro" ||
                preco.destinationType === "bairro-avulso") &&
              preco.bairro
            ? preco.bairro.cidade.name
            : (destino as { city?: string } | null)?.city || "",
      state:
        preco.destinationType === "cidade" && cidadeRelacionada
          ? cidadeRelacionada.stateUf
          : (preco.destinationType === "bairro" ||
                preco.destinationType === "bairro-avulso") &&
              preco.bairro
            ? preco.bairro.cidade.stateUf
            : (destino as { state?: string } | null)?.state || "",
      shippingPrice: preco.shippingPrice,
      rapidDeliveryActive: preco.rapidDeliveryActive,
      deliveryDeadline: preco.deliveryDeadline,
      scheduledDeliveryActive: preco.scheduledDeliveryActive,
      scheduledDeliveryMinDays: preco.scheduledDeliveryMinDays,
      scheduledDeliveryPrice: preco.scheduledDeliveryPrice,
      isActive: preco.isActive,
    };
  });
}
