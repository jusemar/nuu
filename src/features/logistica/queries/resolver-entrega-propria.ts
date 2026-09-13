import "server-only";

import { and, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  agendasGeograficasEntregaPropria,
  bairrosEntregaPropria,
  cepsEspecificos,
  cities,
  productOwnDeliveryPrices,
  productTable,
  shippingRegionCepRanges,
  states,
} from "@/db/schema";
import { listarProvedoresExpedicaoProdutos } from "@/features/fornecedores/queries/listar-provedores-expedicao-produtos";

import { calcularOfertaEntregaPropria } from "../lib/entrega-propria/calcular-oferta-entrega-propria";
import type { PromessaEntregaProgramada } from "../lib/entrega-propria/calcular-promessa-entrega-programada";
import type { PromessaEntregaPropria } from "../lib/entrega-propria/calcular-promessa-entrega-propria";
import { identificarGeografiaEntregaPropria } from "../lib/entrega-propria/identificar-geografia-entrega-propria";
import { normalizarLocalidadeEntregaPropria } from "../lib/entrega-propria/normalizar-localidade-entrega-propria";
import type {
  IdentificadoresGeograficosEntregaPropria,
  NivelGeograficoEntregaPropria,
} from "../lib/entrega-propria/resolver-hierarquia-entrega-propria";

export type EnderecoResolucaoEntregaPropria = {
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type ResultadoResolucaoEntregaPropria =
  | {
      encontrado: true;
      nivelPreco: NivelGeograficoEntregaPropria;
      nivelAgenda: NivelGeograficoEntregaPropria;
      origemAgenda: string;
      entregaRapidaAtiva: boolean;
      valorRapidaEmCentavos: number | null;
      promessaRapida: PromessaEntregaPropria | null;
      entregaProgramada: {
        valorEmCentavos: number;
        promessa: PromessaEntregaProgramada;
      } | null;
      prazoOpcional: string | null;
      regiao: {
        id: number;
        nome: string;
        cidade: string;
        estado: string;
      } | null;
    }
  | { encontrado: false; motivo: string; pendenciaElegivel?: boolean };

type ContextoGeografico = {
  ids: IdentificadoresGeograficosEntregaPropria;
  regiao: {
    id: number;
    name: string;
    city: string;
    state: string;
  } | null;
};

/**
 * Etapa "resolve geografia": traduz o endereço do cliente para os
 * identificadores canônicos Cidade/Região/Bairro/CEP.
 */
async function resolverContextoGeografico(
  endereco: EnderecoResolucaoEntregaPropria,
): Promise<ContextoGeografico | null> {
  const cepLimpo = endereco.cep.replace(/\D/g, "");
  const uf = endereco.uf.toUpperCase();
  const [estado, cidade, cepEspecifico, faixa] = await Promise.all([
    db.query.states.findFirst({
      where: and(eq(states.uf, uf), eq(states.isActive, true)),
      columns: { uf: true },
    }),
    db.query.cities.findFirst({
      where: and(
        ilike(cities.name, endereco.cidade),
        eq(cities.stateUf, uf),
        eq(cities.isActive, true),
      ),
    }),
    db.query.cepsEspecificos.findFirst({
      where: and(
        eq(cepsEspecificos.cep, cepLimpo),
        eq(cepsEspecificos.isActive, true),
      ),
    }),
    db.query.shippingRegionCepRanges.findFirst({
      where: and(
        lte(shippingRegionCepRanges.cepStart, cepLimpo),
        gte(shippingRegionCepRanges.cepEnd, cepLimpo),
        eq(shippingRegionCepRanges.isActive, true),
      ),
      with: { region: true },
    }),
  ]);

  if (!estado || !cidade) return null;

  const bairro = await db.query.bairrosEntregaPropria.findFirst({
    where: and(
      eq(bairrosEntregaPropria.cidadeId, cidade.id),
      eq(
        bairrosEntregaPropria.nomeNormalizado,
        normalizarLocalidadeEntregaPropria(endereco.bairro),
      ),
      eq(bairrosEntregaPropria.ativo, true),
    ),
    with: { regiao: true },
  });

  // O CEP específico só vale quando pertence à mesma cidade/UF do endereço.
  const cepDaCidade =
    cepEspecifico &&
    normalizarLocalidadeEntregaPropria(cepEspecifico.city) ===
      normalizarLocalidadeEntregaPropria(cidade.name) &&
    cepEspecifico.state === uf
      ? cepEspecifico
      : null;

  // Regra compartilhada com o Admin (mesma função pura).
  return identificarGeografiaEntregaPropria({
    cidadeId: cidade.id,
    regiaoFaixaCep: faixa?.region,
    regiaoBairro: bairro?.regiao,
    bairroId: bairro?.id,
    cepEspecificoId: cepDaCidade?.id,
  });
}

function filtroDosDestinos(ids: IdentificadoresGeograficosEntregaPropria) {
  return or(
    ids.cepId
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "cep-especifico"),
          eq(productOwnDeliveryPrices.cepEspecificoId, ids.cepId),
        )
      : undefined,
    ids.bairroId
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "bairro"),
          eq(productOwnDeliveryPrices.bairroId, ids.bairroId),
        )
      : undefined,
    ids.regiaoId
      ? and(
          eq(productOwnDeliveryPrices.destinationType, "region"),
          eq(productOwnDeliveryPrices.regionId, ids.regiaoId),
        )
      : undefined,
    and(
      eq(productOwnDeliveryPrices.destinationType, "cidade"),
      eq(productOwnDeliveryPrices.cityId, ids.cidadeId),
    ),
  );
}

/** Etapa "resolve Agenda Geográfica": carrega as agendas ativas e bloqueios. */
async function listarAgendasAtivas() {
  const agendas = await db.query.agendasGeograficasEntregaPropria.findMany({
    where: eq(agendasGeograficasEntregaPropria.ativa, true),
    with: { datasBloqueadas: { columns: { data: true } } },
  });

  return agendas.map((agenda) => ({
    ...agenda,
    datasBloqueadas: agenda.datasBloqueadas.map((item) => item.data),
  }));
}

function nomeOrigemAgenda(
  nivel: NivelGeograficoEntregaPropria,
  endereco: EnderecoResolucaoEntregaPropria,
  regiao: ContextoGeografico["regiao"],
) {
  if (nivel === "cep") return `CEP ${endereco.cep}`;
  if (nivel === "bairro") return `Bairro ${endereco.bairro}`;
  if (nivel === "regiao") return regiao?.name ?? "Região";
  return `Cidade ${endereco.cidade}`;
}

async function resolverProdutosNoContexto({
  produtosIds,
  endereco,
  contexto,
}: {
  produtosIds: string[];
  endereco: EnderecoResolucaoEntregaPropria;
  contexto: ContextoGeografico;
}): Promise<Map<string, ResultadoResolucaoEntregaPropria>> {
  const [produtos, provedores, precos, agendas] = await Promise.all([
    db
      .select({
        id: productTable.id,
        permiteEntregaPropria: productTable.allowsOwnDelivery,
      })
      .from(productTable)
      .where(inArray(productTable.id, produtosIds)),
    // Produtos com expedição por fornecedor (ex.: Laquila) nunca entram na
    // Entrega Própria: seguem exclusivamente a logística do provedor.
    listarProvedoresExpedicaoProdutos(produtosIds),
    db.query.productOwnDeliveryPrices.findMany({
      where: and(
        inArray(productOwnDeliveryPrices.productId, produtosIds),
        eq(productOwnDeliveryPrices.isActive, true),
        filtroDosDestinos(contexto.ids),
      ),
    }),
    listarAgendasAtivas(),
  ]);
  const produtosPorId = new Map(
    produtos.map((produto) => [produto.id, produto]),
  );
  const dataReferencia = new Date();

  return new Map<string, ResultadoResolucaoEntregaPropria>(
    produtosIds.map((produtoId) => {
      const produto = produtosPorId.get(produtoId);
      if (!produto?.permiteEntregaPropria || provedores.has(produtoId)) {
        return [
          produtoId,
          { encontrado: false, motivo: "Consulte o vendedor" },
        ];
      }

      // Etapas "configuração comercial do Produto" + "cálculo" (regra pura).
      const oferta = calcularOfertaEntregaPropria({
        ids: contexto.ids,
        agendas,
        precos: precos.filter((preco) => preco.productId === produtoId),
        dataReferencia,
      });

      if (!oferta.disponivel) {
        return [
          produtoId,
          oferta.motivo === "sem-agenda"
            ? {
                encontrado: false,
                motivo: "Agenda de entrega não configurada.",
              }
            : oferta.motivo === "sem-preco"
              ? {
                  encontrado: false,
                  motivo: "Consulte o vendedor",
                  pendenciaElegivel: true,
                }
              : { encontrado: false, motivo: "Consulte o vendedor" },
        ];
      }

      return [
        produtoId,
        {
          encontrado: true,
          nivelPreco: oferta.nivelPreco,
          nivelAgenda: oferta.nivelAgenda,
          origemAgenda: nomeOrigemAgenda(
            oferta.nivelAgenda,
            endereco,
            contexto.regiao,
          ),
          entregaRapidaAtiva: Boolean(oferta.promessaRapida),
          valorRapidaEmCentavos: oferta.valorRapidaEmCentavos,
          promessaRapida: oferta.promessaRapida,
          entregaProgramada: oferta.entregaProgramada,
          prazoOpcional: oferta.preco.deliveryDeadline,
          regiao: contexto.regiao
            ? {
                id: contexto.regiao.id,
                nome: contexto.regiao.name,
                cidade: contexto.regiao.city,
                estado: contexto.regiao.state,
              }
            : null,
        },
      ];
    }),
  );
}

export async function resolverEntregaPropriaProduto({
  produtoId,
  endereco,
}: {
  produtoId: string;
  endereco: EnderecoResolucaoEntregaPropria;
}): Promise<ResultadoResolucaoEntregaPropria> {
  const contexto = await resolverContextoGeografico(endereco);
  if (!contexto) {
    return {
      encontrado: false,
      motivo: "Consulte o vendedor",
      pendenciaElegivel: true,
    };
  }
  const resultados = await resolverProdutosNoContexto({
    produtosIds: [produtoId],
    endereco,
    contexto,
  });
  return (
    resultados.get(produtoId) ?? {
      encontrado: false,
      motivo: "Consulte o vendedor",
    }
  );
}

export async function resolverPrevisoesEntregaPropriaProdutos({
  produtosIds,
  endereco,
}: {
  produtosIds: string[];
  endereco: EnderecoResolucaoEntregaPropria;
}) {
  const ids = [...new Set(produtosIds)].slice(0, 80);
  if (ids.length === 0) return {};
  const contexto = await resolverContextoGeografico(endereco);
  if (!contexto) return {};
  const resultados = await resolverProdutosNoContexto({
    produtosIds: ids,
    endereco,
    contexto,
  });

  return Object.fromEntries(
    [...resultados.entries()].flatMap(([produtoId, resultado]) =>
      resultado.encontrado && resultado.promessaRapida
        ? [[produtoId, resultado.promessaRapida.texto]]
        : [],
    ),
  ) as Record<string, string>;
}
