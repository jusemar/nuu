import "server-only";

import { and, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  bairrosAvulsos,
  categoryTable,
  cepsEspecificos,
  cities,
  politicasEntregaPropriaTable,
  precosPoliticasEntregaPropriaTable,
  productTable,
  regioBairros,
  shippingRegionCepRanges,
} from "@/db/schema";

import {
  calcularPromessaEntregaProgramada,
  type PromessaEntregaProgramada,
} from "../lib/entrega-propria/calcular-promessa-entrega-programada";
import {
  calcularPromessaEntregaPropria,
  type PromessaEntregaPropria,
} from "../lib/entrega-propria/calcular-promessa-entrega-propria";
import { resolverPoliticaEntregaPropria } from "../lib/entrega-propria/resolver-politica-entrega-propria";
import { resolverPoliticaRetiradaEntregaPropria } from "../lib/entrega-propria/resolver-politica-entrega-propria";

const DATAS_BLOQUEADAS_ENTREGA_PROPRIA: string[] = [];

export type ResultadoPoliticaEntregaPropria = {
  encontrada: true;
  politicaId: string;
  nivel: "cep-especifico" | "bairro-avulso" | "regiao" | "cidade" | "uf";
  entregaRapidaAtiva: boolean;
  valorRapidaEmCentavos: number | null;
  promessaRapida: PromessaEntregaPropria | null;
  entregaProgramada: {
    valorEmCentavos: number;
    promessa: PromessaEntregaProgramada;
  } | null;
};

async function listarAncestraisCategoria(categoriaId: string) {
  const categorias = await db
    .select({ id: categoryTable.id, parentId: categoryTable.parentId })
    .from(categoryTable);
  const porId = new Map(
    categorias.map((categoria) => [categoria.id, categoria]),
  );
  const ids: string[] = [];
  const visitados = new Set<string>();
  let atual = porId.get(categoriaId)?.parentId ?? null;
  while (atual && !visitados.has(atual)) {
    visitados.add(atual);
    ids.push(atual);
    atual = porId.get(atual)?.parentId ?? null;
  }
  return ids;
}

export async function buscarRetiradaPoliticaEntregaPropria({
  produtoId,
  categoriaId,
}: {
  produtoId: string;
  categoriaId: string;
}) {
  const ancestrais = await listarAncestraisCategoria(categoriaId);
  const politicas = await db
    .select()
    .from(politicasEntregaPropriaTable)
    .where(
      and(
        eq(politicasEntregaPropriaTable.ativa, true),
        or(
          eq(politicasEntregaPropriaTable.produtoId, produtoId),
          inArray(politicasEntregaPropriaTable.categoriaId, [
            categoriaId,
            ...ancestrais,
          ]),
        ),
      ),
    );
  const politica = resolverPoliticaRetiradaEntregaPropria({
    politicas,
    contexto: {
      produtoId,
      categoriaId,
      ancestraisCategoriaIds: ancestrais,
    },
  });
  if (!politica) return null;
  const modelo = politica.modeloRetiradaId
    ? await db.query.modelosRetiradaTable.findFirst({
        where: (tabela, { eq }) => eq(tabela.id, politica.modeloRetiradaId!),
      })
    : null;
  return {
    permiteRetirada: politica.permiteRetirada === true,
    modeloRetirada: modelo?.ativo ? modelo : null,
  };
}

export async function buscarPoliticaEntregaPropria({
  produtoId,
  cep,
  bairro,
  cidade,
  uf,
}: {
  produtoId: string;
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
}): Promise<ResultadoPoliticaEntregaPropria | null> {
  const produto = await db.query.productTable.findFirst({
    where: eq(productTable.id, produtoId),
    columns: { id: true, categoryId: true },
  });
  if (!produto) return null;

  const cepLimpo = cep.replace(/\D/g, "");
  const [
    cepEncontrado,
    bairroEncontrado,
    cidadeEncontrada,
    faixa,
    regioesBairro,
  ] = await Promise.all([
    db.query.cepsEspecificos.findFirst({
      where: and(
        eq(cepsEspecificos.cep, cepLimpo),
        eq(cepsEspecificos.isActive, true),
      ),
    }),
    db.query.bairrosAvulsos.findFirst({
      where: and(
        ilike(bairrosAvulsos.neighborhood, bairro),
        ilike(bairrosAvulsos.city, cidade),
        eq(bairrosAvulsos.state, uf),
        eq(bairrosAvulsos.isActive, true),
      ),
    }),
    db.query.cities.findFirst({
      where: and(
        ilike(cities.name, cidade),
        eq(cities.stateUf, uf),
        eq(cities.isActive, true),
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
    db.query.regioBairros.findMany({
      where: ilike(regioBairros.neighborhood, bairro),
      with: { regiao: true },
    }),
  ]);

  const regiao =
    (faixa?.region?.isActive &&
    faixa.region.state === uf &&
    faixa.region.city.toLocaleLowerCase("pt-BR") ===
      cidade.toLocaleLowerCase("pt-BR")
      ? faixa.region
      : null) ??
    regioesBairro.find(
      (item) =>
        item.regiao.isActive &&
        item.regiao.state === uf &&
        item.regiao.city.toLocaleLowerCase("pt-BR") ===
          cidade.toLocaleLowerCase("pt-BR"),
    )?.regiao ??
    null;

  const ancestrais = await listarAncestraisCategoria(produto.categoryId);
  const politicas = await db
    .select()
    .from(politicasEntregaPropriaTable)
    .where(
      and(
        eq(politicasEntregaPropriaTable.ativa, true),
        or(
          eq(politicasEntregaPropriaTable.produtoId, produtoId),
          inArray(politicasEntregaPropriaTable.categoriaId, [
            produto.categoryId,
            ...ancestrais,
          ]),
        ),
      ),
    );
  const precos = politicas.length
    ? await db
        .select()
        .from(precosPoliticasEntregaPropriaTable)
        .where(
          and(
            eq(precosPoliticasEntregaPropriaTable.ativa, true),
            inArray(
              precosPoliticasEntregaPropriaTable.politicaId,
              politicas.map((politica) => politica.id),
            ),
          ),
        )
    : [];

  const resolvida = resolverPoliticaEntregaPropria({
    politicas,
    precos: precos.map((preco) => ({
      politicaId: preco.politicaId,
      tipoDestino: preco.tipoDestino,
      destinoIdOuUf:
        preco.tipoDestino === "cep"
          ? String(preco.cepEspecificoId)
          : preco.tipoDestino === "bairro"
            ? String(preco.bairroAvulsoId)
            : preco.tipoDestino === "regiao"
              ? String(preco.regiaoId)
              : preco.tipoDestino === "cidade"
                ? String(preco.cidadeId)
                : (preco.uf ?? ""),
      precoRapidaEmCentavos: preco.precoRapidaEmCentavos,
      precoProgramadaEmCentavos: preco.precoProgramadaEmCentavos,
      ativa: preco.ativa,
    })),
    contexto: {
      produtoId,
      categoriaId: produto.categoryId,
      ancestraisCategoriaIds: ancestrais,
      destinos: {
        cep: cepEncontrado ? String(cepEncontrado.id) : undefined,
        bairro: bairroEncontrado ? String(bairroEncontrado.id) : undefined,
        regiao: regiao ? String(regiao.id) : undefined,
        cidade: cidadeEncontrada ? String(cidadeEncontrada.id) : undefined,
        uf: uf.toUpperCase(),
      },
    },
  });
  if (!resolvida) return null;

  const agenda = {
    ativa: true,
    diasDaSemana: resolvida.politica.diasAtendidos,
    horarioCorte: resolvida.politica.horarioCorte,
  };
  const promessaBaseRapida =
    resolvida.politica.entregaRapidaAtiva ||
    resolvida.politica.entregaProgramadaAtiva
      ? calcularPromessaEntregaPropria({
          agenda,
          feriados: DATAS_BLOQUEADAS_ENTREGA_PROPRIA,
        })
      : null;
  const promessaRapida = resolvida.politica.entregaRapidaAtiva
    ? promessaBaseRapida
    : null;
  const promessaProgramada =
    resolvida.politica.entregaProgramadaAtiva &&
    resolvida.politica.prazoMinimoProgramadaDias !== null
      ? calcularPromessaEntregaProgramada({
          agenda,
          promessaRapida: promessaBaseRapida,
          quantidadeJanelasAposRapida:
            resolvida.politica.prazoMinimoProgramadaDias,
          datasBloqueadas: DATAS_BLOQUEADAS_ENTREGA_PROPRIA,
        })
      : null;

  return {
    encontrada: true,
    politicaId: resolvida.politica.id,
    nivel:
      resolvida.preco.tipoDestino === "cep"
        ? "cep-especifico"
        : resolvida.preco.tipoDestino === "bairro"
          ? "bairro-avulso"
          : resolvida.preco.tipoDestino,
    entregaRapidaAtiva:
      resolvida.politica.entregaRapidaAtiva &&
      resolvida.preco.precoRapidaEmCentavos !== null &&
      promessaRapida !== null,
    valorRapidaEmCentavos: resolvida.preco.precoRapidaEmCentavos,
    promessaRapida,
    entregaProgramada:
      promessaProgramada && resolvida.preco.precoProgramadaEmCentavos !== null
        ? {
            valorEmCentavos: resolvida.preco.precoProgramadaEmCentavos,
            promessa: promessaProgramada,
          }
        : null,
  };
}
