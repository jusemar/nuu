import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutPagamentosTable,
  checkoutPedidosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type {
  PedidoAuditoriaFreteGratisAdmin,
  ResultadoAuditoriaFreteGratisAdmin,
  StatusPagamentoAuditoriaCupom,
} from "../types";

type FiltrosAuditoriaFreteGratisAdmin = {
  busca?: string;
  numeroPedido?: string;
  cliente?: string;
  statusPagamento?: string;
  regraFreteGratisId?: string;
  periodoInicio?: string;
  periodoFim?: string;
  pagina?: number;
  limite?: number;
};

type LinhaAuditoriaFreteGratis = {
  pedidoId: string;
  numeroPedido: string;
  clienteId: string | null;
  clienteNome: string | null;
  clienteEmail: string | null;
  subtotalEmCentavos: number;
  freteOriginalEmCentavos: number;
  freteFinalEmCentavos: number;
  descontoFreteEmCentavos: number;
  regraFreteGratisId: string | null;
  regraPromocaoId: string | null;
  modalidadeAplicada: string | null;
  modalidadesElegiveis: string | null;
  regiaoAplicada: string | null;
  regioesElegiveis: string | null;
  transportadoraAplicada: string | null;
  transportadorasElegiveis: string | null;
  servicoAplicado: string | null;
  servicosElegiveis: string | null;
  tipoPrioridadeFreteGratis: string | null;
  regrasIgnoradasPorPrecedencia: string | null;
  gatewayPagamento: string | null;
  metodoPagamento: string | null;
  statusPagamento: StatusPagamentoAuditoriaCupom | null;
  dataPedido: Date;
};

const condicaoFreteGratisAplicado = sql`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,aplicado}' = 'true'`;
const descontoFreteSnapshot = sql<number>`coalesce((${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,descontoFretePromocionalEmCentavos}')::int, 0)`;
const freteOriginalSnapshot = sql<number>`coalesce((${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,valorFreteOriginalEmCentavos}')::int, 0)`;
const freteFinalSnapshot = sql<number>`coalesce((${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,valorFreteFinalEmCentavos}')::int, ${checkoutPedidosTable.freteEmCentavos})`;
const regraFreteGratisIdSnapshot = sql<
  string | null
>`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,id}'`;
const regraPromocaoIdSnapshot = sql<
  string | null
>`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,regraPromocaoId}'`;
const modalidadeAplicadaSnapshot = sql<
  string | null
>`coalesce(${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,modalidadeAplicada}', ${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,modalidade}')`;
const modalidadesElegiveisSnapshot = sql<
  string | null
>`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,modalidadesElegiveis}'`;
const regiaoAplicadaSnapshot = sql<
  string | null
>`coalesce(${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regiaoAplicada}', ${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,regiaoCodigo}')`;
const regioesElegiveisSnapshot = sql<
  string | null
>`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regioesElegiveis}'`;
const transportadoraAplicadaSnapshot = sql<
  string | null
>`coalesce(${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,transportadoraAplicada}', ${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,transportadoraCodigo}')`;
const servicoAplicadoSnapshot = sql<
  string | null
>`coalesce(${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,servicoAplicado}', ${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,servicoCodigo}')`;
const fretesSelecionadosElegiveisSnapshot = sql<
  string | null
>`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,fretesSelecionadosElegiveis}'`;
const tipoPrioridadeFreteGratisSnapshot = sql<
  string | null
>`coalesce(${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,tipoPrioridadeFreteGratis}', ${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regraFreteGratisAplicada,tipoPrioridade}')`;
const regrasIgnoradasPorPrecedenciaSnapshot = sql<
  string | null
>`${checkoutPedidosTable.snapshotDescontos} #>> '{freteGratisPromocional,regrasIgnoradasPorPrecedencia}'`;

function normalizarPagina(valor?: number) {
  return Math.max(Number(valor ?? 1), 1);
}

function normalizarLimite(valor?: number) {
  return Math.min(Math.max(Number(valor ?? 10), 1), 50);
}

function criarCondicoesAuditoriaFreteGratis(
  filtros: FiltrosAuditoriaFreteGratisAdmin,
) {
  const condicoes: SQL[] = [condicaoFreteGratisAplicado];

  if (filtros.busca?.trim()) {
    condicoes.push(
      or(
        ilike(checkoutPedidosTable.numeroPedido, `%${filtros.busca}%`),
        ilike(checkoutClientesTable.nome, `%${filtros.busca}%`),
        ilike(checkoutClientesTable.email, `%${filtros.busca}%`),
      )!,
    );
  }

  if (filtros.numeroPedido?.trim()) {
    condicoes.push(
      ilike(checkoutPedidosTable.numeroPedido, `%${filtros.numeroPedido}%`),
    );
  }

  if (filtros.cliente?.trim()) {
    condicoes.push(
      or(
        ilike(checkoutClientesTable.nome, `%${filtros.cliente}%`),
        ilike(checkoutClientesTable.email, `%${filtros.cliente}%`),
      )!,
    );
  }

  if (filtros.statusPagamento && filtros.statusPagamento !== "todos") {
    condicoes.push(
      eq(
        checkoutPedidosTable.pagamentoStatus,
        filtros.statusPagamento as StatusPagamentoAuditoriaCupom,
      ),
    );
  }

  if (filtros.regraFreteGratisId?.trim()) {
    condicoes.push(
      sql`${regraFreteGratisIdSnapshot} = ${filtros.regraFreteGratisId}`,
    );
  }

  if (filtros.periodoInicio?.trim()) {
    condicoes.push(
      gte(checkoutPedidosTable.createdAt, new Date(filtros.periodoInicio)),
    );
  }

  if (filtros.periodoFim?.trim()) {
    condicoes.push(
      lte(checkoutPedidosTable.createdAt, new Date(filtros.periodoFim)),
    );
  }

  return and(...condicoes);
}

function mapearLinhaAuditoriaFreteGratis(
  linha: LinhaAuditoriaFreteGratis,
): PedidoAuditoriaFreteGratisAdmin {
  return linha;
}

export async function listarAuditoriaFreteGratisAdmin(
  filtrosEntrada: FiltrosAuditoriaFreteGratisAdmin = {},
): Promise<ResultadoAuditoriaFreteGratisAdmin> {
  const pagina = normalizarPagina(filtrosEntrada.pagina);
  const limite = normalizarLimite(filtrosEntrada.limite);
  const deslocamento = (pagina - 1) * limite;
  const filtros = { ...filtrosEntrada, pagina, limite };
  const condicoes = criarCondicoesAuditoriaFreteGratis(filtros);

  const [totalResultado, resumoResultado, regraMaisUsadaResultado, pedidos] =
    await Promise.all([
      dbTransacional
        .select({ total: count() })
        .from(checkoutPedidosTable)
        .leftJoin(
          checkoutClientesTable,
          eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
        )
        .where(condicoes),
      dbTransacional
        .select({
          totalPedidosComFreteGratis: count(),
          totalDescontoFreteEmCentavos: sql<number>`coalesce(sum(${descontoFreteSnapshot}), 0)`,
          ticketMedioEmCentavos: sql<number>`coalesce(avg(${checkoutPedidosTable.totalEmCentavos})::int, 0)`,
        })
        .from(checkoutPedidosTable)
        .leftJoin(
          checkoutClientesTable,
          eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
        )
        .where(condicoes),
      dbTransacional
        .select({
          regraFreteGratisId: regraFreteGratisIdSnapshot,
          totalPedidos: count(),
          totalDescontoEmCentavos: sql<number>`coalesce(sum(${descontoFreteSnapshot}), 0)`,
        })
        .from(checkoutPedidosTable)
        .leftJoin(
          checkoutClientesTable,
          eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
        )
        .where(condicoes)
        .groupBy(regraFreteGratisIdSnapshot)
        .orderBy(desc(count()))
        .limit(1),
      dbTransacional
        .select({
          pedidoId: checkoutPedidosTable.id,
          numeroPedido: checkoutPedidosTable.numeroPedido,
          clienteId: checkoutClientesTable.id,
          clienteNome: checkoutClientesTable.nome,
          clienteEmail: checkoutClientesTable.email,
          subtotalEmCentavos: checkoutPedidosTable.subtotalEmCentavos,
          freteOriginalEmCentavos: freteOriginalSnapshot,
          freteFinalEmCentavos: freteFinalSnapshot,
          descontoFreteEmCentavos: descontoFreteSnapshot,
          regraFreteGratisId: regraFreteGratisIdSnapshot,
          regraPromocaoId: regraPromocaoIdSnapshot,
          modalidadeAplicada: modalidadeAplicadaSnapshot,
          modalidadesElegiveis: modalidadesElegiveisSnapshot,
          regiaoAplicada: regiaoAplicadaSnapshot,
          regioesElegiveis: regioesElegiveisSnapshot,
          transportadoraAplicada: transportadoraAplicadaSnapshot,
          transportadorasElegiveis: fretesSelecionadosElegiveisSnapshot,
          servicoAplicado: servicoAplicadoSnapshot,
          servicosElegiveis: fretesSelecionadosElegiveisSnapshot,
          tipoPrioridadeFreteGratis: tipoPrioridadeFreteGratisSnapshot,
          regrasIgnoradasPorPrecedencia: regrasIgnoradasPorPrecedenciaSnapshot,
          gatewayPagamento: checkoutPedidosTable.gatewayPagamento,
          metodoPagamento: checkoutPagamentosTable.metodo,
          statusPagamento: checkoutPedidosTable.pagamentoStatus,
          dataPedido: checkoutPedidosTable.createdAt,
        })
        .from(checkoutPedidosTable)
        .leftJoin(
          checkoutClientesTable,
          eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
        )
        .leftJoin(
          checkoutPagamentosTable,
          eq(checkoutPagamentosTable.pedidoId, checkoutPedidosTable.id),
        )
        .where(condicoes)
        .orderBy(desc(checkoutPedidosTable.createdAt))
        .limit(limite)
        .offset(deslocamento),
    ]);

  const total = totalResultado[0]?.total ?? 0;
  const regraMaisUsada = regraMaisUsadaResultado[0]?.regraFreteGratisId
    ? {
        regraFreteGratisId: regraMaisUsadaResultado[0].regraFreteGratisId,
        totalPedidos: regraMaisUsadaResultado[0].totalPedidos,
        totalDescontoEmCentavos:
          regraMaisUsadaResultado[0].totalDescontoEmCentavos,
      }
    : null;

  return {
    pedidos: pedidos.map(mapearLinhaAuditoriaFreteGratis),
    resumo: {
      totalPedidosComFreteGratis:
        resumoResultado[0]?.totalPedidosComFreteGratis ?? 0,
      totalDescontoFreteEmCentavos:
        resumoResultado[0]?.totalDescontoFreteEmCentavos ?? 0,
      ticketMedioEmCentavos: resumoResultado[0]?.ticketMedioEmCentavos ?? 0,
      regraMaisUsada,
    },
    total,
    pagina,
    limite,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}
