import "server-only";

import { and, asc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import { cities, shippingRegions, states } from "../../../db/schema";
import {
  normalizarTextoCodigoRegiaoPromocional,
  obterMacrorregioesPromocionais,
} from "../lib/codigos-regiao-promocional";
import { buscarRegioesPromocaoAdminSchema } from "../schemas";
import type { RegiaoPromocaoAdmin } from "../types";

function correspondeBusca(regiao: RegiaoPromocaoAdmin, busca: string) {
  const termo = normalizarTextoCodigoRegiaoPromocional(busca);
  const texto = normalizarTextoCodigoRegiaoPromocional(
    `${regiao.codigo} ${regiao.nome} ${regiao.descricao ?? ""}`,
  );

  return texto.includes(termo);
}

export async function buscarRegioesPromocaoAdmin(
  entrada: unknown,
): Promise<RegiaoPromocaoAdmin[]> {
  const filtros = buscarRegioesPromocaoAdminSchema.parse(entrada);
  const busca = filtros.busca.trim();
  const buscaLike = `%${busca}%`;

  const regioesFixas: RegiaoPromocaoAdmin[] = [
    {
      codigo: "brasil",
      nome: "Brasil",
      tipo: "pais" as const,
      descricao: "Regra promocional nacional.",
    },
    ...obterMacrorregioesPromocionais().map((macrorregiao) => ({
      codigo: macrorregiao.codigo,
      nome: macrorregiao.nome,
      tipo: "macrorregiao" as const,
      descricao: "Macrorregião promocional derivada do UF de entrega.",
    })),
  ].filter((regiao) => correspondeBusca(regiao, busca));

  const [estados, cidadesAtivas, regioesEntrega] = await Promise.all([
    db
      .select({ uf: states.uf, nome: states.name })
      .from(states)
      .where(
        and(
          eq(states.isActive, true),
          or(ilike(states.uf, buscaLike), ilike(states.name, buscaLike)),
        ),
      )
      .orderBy(asc(states.name))
      .limit(filtros.limite),
    db
      .select({ id: cities.id, nome: cities.name, uf: cities.stateUf })
      .from(cities)
      .where(
        and(
          eq(cities.isActive, true),
          or(ilike(cities.name, buscaLike), ilike(cities.stateUf, buscaLike)),
        ),
      )
      .orderBy(asc(cities.name))
      .limit(filtros.limite),
    db
      .select({
        id: shippingRegions.id,
        nome: shippingRegions.name,
        cidade: shippingRegions.city,
        uf: shippingRegions.state,
      })
      .from(shippingRegions)
      .where(
        and(
          eq(shippingRegions.isActive, true),
          or(
            ilike(shippingRegions.name, buscaLike),
            ilike(shippingRegions.city, buscaLike),
            ilike(shippingRegions.state, buscaLike),
          ),
        ),
      )
      .orderBy(asc(shippingRegions.state), asc(shippingRegions.city))
      .limit(filtros.limite),
  ]);

  const regioes: RegiaoPromocaoAdmin[] = [
    ...regioesFixas,
    ...estados.map((estado) => ({
      codigo: `uf:${estado.uf}`,
      nome: `${estado.nome} (${estado.uf})`,
      tipo: "estado" as const,
      descricao: "Estado de entrega promocional.",
    })),
    ...cidadesAtivas.map((cidade) => ({
      codigo: `cidade:${cidade.uf}:${normalizarTextoCodigoRegiaoPromocional(cidade.nome)}`,
      nome: `${cidade.nome} - ${cidade.uf}`,
      tipo: "cidade" as const,
      descricao: "Cidade ativa na estrutura logística existente.",
    })),
    ...regioesEntrega.map((regiao) => ({
      codigo: `regiao_entrega:${regiao.id}`,
      nome: `${regiao.nome} - ${regiao.cidade}/${regiao.uf}`,
      tipo: "regiao_entrega" as const,
      descricao:
        "Região de entrega existente usada apenas como escopo promocional.",
    })),
  ];

  const regioesUnicas = new Map<string, RegiaoPromocaoAdmin>();
  for (const regiao of regioes) regioesUnicas.set(regiao.codigo, regiao);

  return Array.from(regioesUnicas.values()).slice(0, filtros.limite);
}
