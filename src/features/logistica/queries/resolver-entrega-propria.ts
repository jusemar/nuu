import "server-only";

import { and, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  agendasGeograficasEntregaPropria,
  bairrosEntregaPropria,
  categoryOwnDeliveryPrices,
  categoryTable,
  cepsEspecificos,
  cities,
  productOwnDeliveryPrices,
  productTable,
  shippingRegionCepRanges,
  states,
} from "@/db/schema";
import { listarProvedoresExpedicaoProdutos } from "@/features/fornecedores/queries/listar-provedores-expedicao-produtos";

import { montarCadeiaCategorias } from "../lib/disponibilidade/resolver-modo-herdado";
import {
  calcularOfertaEntregaPropria,
  type PrecoProdutoParaCalculo,
} from "../lib/entrega-propria/calcular-oferta-entrega-propria";
import type { PromessaEntregaProgramada } from "../lib/entrega-propria/calcular-promessa-entrega-programada";
import type { PromessaEntregaPropria } from "../lib/entrega-propria/calcular-promessa-entrega-propria";
import {
  escolherFonteComercialEntregaPropria,
  type FonteComercialEntregaPropria,
} from "../lib/entrega-propria/escolher-fonte-comercial-entrega-propria";
import { identificarGeografiaEntregaPropria } from "../lib/entrega-propria/identificar-geografia-entrega-propria";
import { normalizarLocalidadeEntregaPropria } from "../lib/entrega-propria/normalizar-localidade-entrega-propria";
import {
  modoEntregaPropriaDoProduto,
  resolverDisponibilidadeEntregaPropria,
} from "../lib/entrega-propria/resolver-disponibilidade-entrega-propria";
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
      /** Produto, Categoria direta ou Categoria ancestral. */
      fonteComercial: FonteComercialEntregaPropria;
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

/**
 * Filtra os destinos aplicáveis à geografia. Produto e Categoria usam tabelas
 * com o MESMO formato, então a mesma condição serve às duas fontes.
 */
function filtroDosDestinos(
  tabela: typeof productOwnDeliveryPrices | typeof categoryOwnDeliveryPrices,
  ids: IdentificadoresGeograficosEntregaPropria,
) {
  return or(
    ids.cepId
      ? and(
          eq(tabela.destinationType, "cep-especifico"),
          eq(tabela.cepEspecificoId, ids.cepId),
        )
      : undefined,
    ids.bairroId
      ? and(
          eq(tabela.destinationType, "bairro"),
          eq(tabela.bairroId, ids.bairroId),
        )
      : undefined,
    ids.regiaoId
      ? and(
          eq(tabela.destinationType, "region"),
          eq(tabela.regionId, ids.regiaoId),
        )
      : undefined,
    and(eq(tabela.destinationType, "cidade"), eq(tabela.cityId, ids.cidadeId)),
  );
}

/** Árvore de categorias com o modo de Entrega Própria (tabela pequena). */
function listarCategoriasEntregaPropria() {
  return db
    .select({
      id: categoryTable.id,
      nome: categoryTable.name,
      parentId: categoryTable.parentId,
      modo: categoryTable.disponibilidadeEntregaPropria,
    })
    .from(categoryTable);
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
  const [produtos, provedores, precos, agendas, categorias] = await Promise.all(
    [
      db
        .select({
          id: productTable.id,
          categoriaId: productTable.categoryId,
          modo: productTable.disponibilidadeEntregaPropria,
          permiteEntregaPropriaLegado: productTable.allowsOwnDelivery,
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
          filtroDosDestinos(productOwnDeliveryPrices, contexto.ids),
        ),
      }),
      listarAgendasAtivas(),
      listarCategoriasEntregaPropria(),
    ],
  );
  const produtosPorId = new Map(
    produtos.map((produto) => [produto.id, produto]),
  );
  const cadeiaPorProdutoId = new Map(
    produtos.map((produto) => [
      produto.id,
      montarCadeiaCategorias(categorias, produto.categoriaId),
    ]),
  );
  // Condições comerciais das categorias (diretas e ancestrais) envolvidas.
  const categoriasEnvolvidas = [
    ...new Set(
      [...cadeiaPorProdutoId.values()].flatMap((cadeia) =>
        cadeia.map((categoria) => categoria.id),
      ),
    ),
  ];
  const precosCategorias =
    categoriasEnvolvidas.length > 0
      ? await db.query.categoryOwnDeliveryPrices.findMany({
          where: and(
            inArray(categoryOwnDeliveryPrices.categoryId, categoriasEnvolvidas),
            eq(categoryOwnDeliveryPrices.isActive, true),
            filtroDosDestinos(categoryOwnDeliveryPrices, contexto.ids),
          ),
        })
      : [];
  const precosPorCategoriaId = new Map<string, typeof precosCategorias>();
  for (const preco of precosCategorias) {
    precosPorCategoriaId.set(preco.categoryId, [
      ...(precosPorCategoriaId.get(preco.categoryId) ?? []),
      preco,
    ]);
  }
  const dataReferencia = new Date();

  return new Map<string, ResultadoResolucaoEntregaPropria>(
    produtosIds.map((produtoId) => {
      const produto = produtosPorId.get(produtoId);
      const cadeia = cadeiaPorProdutoId.get(produtoId) ?? [];
      // Etapa "disponibilidade": Produto > Categoria > ancestrais > padrão.
      // Fornecedor (ex.: Laquila) nunca recebe Entrega Própria por herança.
      const disponibilidade = produto
        ? resolverDisponibilidadeEntregaPropria({
            modoProduto: modoEntregaPropriaDoProduto(produto),
            cadeiaCategorias: cadeia,
            expedidoPorFornecedor: provedores.has(produtoId),
          })
        : null;
      if (!disponibilidade?.ativo) {
        return [
          produtoId,
          { encontrado: false, motivo: "Consulte o vendedor" },
        ];
      }

      // Etapa "configuração comercial": Produto > Categoria direta > ancestral.
      const fonte = escolherFonteComercialEntregaPropria<
        PrecoProdutoParaCalculo & { isActive: boolean }
      >({
        ids: contexto.ids,
        precosProduto: precos.filter((preco) => preco.productId === produtoId),
        cadeiaCategorias: cadeia,
        precosPorCategoriaId,
      });

      // Etapa "cálculo" (regra pura, agenda + CEP > Bairro > Região > Cidade).
      const oferta = calcularOfertaEntregaPropria({
        ids: contexto.ids,
        agendas,
        precos: fonte?.precos ?? [],
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
          fonteComercial: fonte!.fonte,
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
