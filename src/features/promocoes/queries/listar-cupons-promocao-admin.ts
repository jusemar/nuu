import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import { cuponsPromocaoTable } from "../../../db/schema";
import { filtrosCuponsPromocaoAdminSchema } from "../schemas";
import type {
  CupomPromocaoAdmin,
  ResultadoCuponsPromocaoAdmin,
} from "../types";

type FiltrosCuponsPromocaoAdmin = {
  busca?: string;
  status?: string;
  pagina?: number;
  limite?: number;
};

function criarCondicoesCupons(filtros: FiltrosCuponsPromocaoAdmin) {
  const condicoes = [];

  if (filtros.busca) {
    condicoes.push(
      or(
        ilike(cuponsPromocaoTable.codigo, `%${filtros.busca}%`),
        ilike(cuponsPromocaoTable.nome, `%${filtros.busca}%`),
      ),
    );
  }

  if (filtros.status === "ativos") {
    condicoes.push(eq(cuponsPromocaoTable.ativo, true));
  }

  if (filtros.status === "inativos") {
    condicoes.push(eq(cuponsPromocaoTable.ativo, false));
  }

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

function mapearCupomAdmin(
  cupom: typeof cuponsPromocaoTable.$inferSelect,
): CupomPromocaoAdmin {
  return {
    id: cupom.id,
    codigo: cupom.codigo,
    nome: cupom.nome,
    ativo: cupom.ativo,
    tipoDesconto: cupom.tipoDesconto,
    valorDesconto: cupom.valorDesconto,
    freteGratis: cupom.freteGratis,
    prioridade: cupom.prioridade,
    acumulativo: cupom.acumulativo,
    subtotalMinimo: cupom.subtotalMinimo,
    limiteUsoTotal: cupom.limiteUsoTotal,
    limiteUsoPorCliente: cupom.limiteUsoPorCliente,
    totalUsos: cupom.totalUsos,
    dataInicio: cupom.dataInicio,
    dataFim: cupom.dataFim,
    criadoEm: cupom.criadoEm,
    atualizadoEm: cupom.atualizadoEm,
  };
}

export async function listarCuponsPromocaoAdmin(
  filtrosEntrada: FiltrosCuponsPromocaoAdmin = {},
): Promise<ResultadoCuponsPromocaoAdmin> {
  const filtros = filtrosCuponsPromocaoAdminSchema.parse(filtrosEntrada);
  const condicoes = criarCondicoesCupons(filtros);
  const deslocamento = (filtros.pagina - 1) * filtros.limite;

  const [totalResultado, cupons] = await Promise.all([
    db.select({ total: count() }).from(cuponsPromocaoTable).where(condicoes),
    db
      .select()
      .from(cuponsPromocaoTable)
      .where(condicoes)
      .orderBy(
        desc(cuponsPromocaoTable.prioridade),
        desc(cuponsPromocaoTable.atualizadoEm),
      )
      .limit(filtros.limite)
      .offset(deslocamento),
  ]);

  return {
    cupons: cupons.map(mapearCupomAdmin),
    total: totalResultado[0]?.total ?? 0,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totalPaginas: Math.max(
      1,
      Math.ceil((totalResultado[0]?.total ?? 0) / filtros.limite),
    ),
  };
}
