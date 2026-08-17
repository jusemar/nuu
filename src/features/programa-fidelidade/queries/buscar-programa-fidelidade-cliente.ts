import "server-only";

import { and, countDistinct, desc, eq, inArray, sql, sum } from "drizzle-orm";

import {
  carteirasFidelidadeTable,
  checkoutClientesTable,
  checkoutPedidosTable,
  configuracoesProgramaFidelidadeTable,
  processamentosPedidosFidelidadeTable,
  transacoesFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type { FiltrosHistoricoFidelidadeCliente } from "../schemas/historico-fidelidade-cliente.schema";
import type { ProgramaFidelidadeCliente } from "../types/programa-fidelidade-cliente.types";

/**
 * Resolve as carteiras exclusivamente pelo usuário autenticado. A função nunca aceita
 * `clienteId`, impedindo que query strings ou payloads escolham a carteira consultada.
 */
export async function buscarProgramaFidelidadeCliente({
  usuarioId,
  filtros,
}: {
  usuarioId: string;
  filtros: FiltrosHistoricoFidelidadeCliente;
}): Promise<ProgramaFidelidadeCliente> {
  const clientes = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(eq(checkoutClientesTable.userId, usuarioId));
  const clientesIds = clientes.map((cliente) => cliente.id);

  const [configuracao] = await dbTransacional
    .select()
    .from(configuracoesProgramaFidelidadeTable)
    .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
    .limit(1);

  if (clientesIds.length === 0) {
    return montarResultadoVazio(configuracao ?? null, filtros);
  }

  const [totais] = await dbTransacional
    .select({
      disponiveis: sum(carteirasFidelidadeTable.pontosDisponiveis),
      pendentes: sum(carteirasFidelidadeTable.pontosPendentes),
      acumulado: sum(carteirasFidelidadeTable.totalAcumuladoHistorico),
      revertidos: sum(carteirasFidelidadeTable.pontosRevertidos),
      reservados: sum(carteirasFidelidadeTable.pontosReservados),
      utilizados: sum(carteirasFidelidadeTable.pontosUtilizados),
    })
    .from(carteirasFidelidadeTable)
    .where(inArray(carteirasFidelidadeTable.clienteId, clientesIds));

  const condicaoCredito = and(
    inArray(processamentosPedidosFidelidadeTable.clienteId, clientesIds),
    eq(transacoesFidelidadeTable.tipo, "credito_pendente"),
  );
  const [contagem] = await dbTransacional
    .select({
      total: countDistinct(processamentosPedidosFidelidadeTable.pedidoId),
    })
    .from(processamentosPedidosFidelidadeTable)
    .innerJoin(
      transacoesFidelidadeTable,
      eq(
        transacoesFidelidadeTable.pedidoId,
        processamentosPedidosFidelidadeTable.pedidoId,
      ),
    )
    .where(condicaoCredito);
  const total = contagem?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / filtros.porPagina));
  const pagina = Math.min(filtros.pagina, totalPaginas);

  const linhas = await dbTransacional
    .select({
      pedidoId: processamentosPedidosFidelidadeTable.pedidoId,
      numeroPedido: checkoutPedidosTable.numeroPedido,
      situacao: processamentosPedidosFidelidadeTable.situacao,
      pontos: sql<string>`sum(${transacoesFidelidadeTable.pontos})`,
      data: processamentosPedidosFidelidadeTable.updatedAt,
    })
    .from(processamentosPedidosFidelidadeTable)
    .innerJoin(
      checkoutPedidosTable,
      eq(
        checkoutPedidosTable.id,
        processamentosPedidosFidelidadeTable.pedidoId,
      ),
    )
    .innerJoin(
      transacoesFidelidadeTable,
      eq(
        transacoesFidelidadeTable.pedidoId,
        processamentosPedidosFidelidadeTable.pedidoId,
      ),
    )
    .where(condicaoCredito)
    .groupBy(
      processamentosPedidosFidelidadeTable.pedidoId,
      checkoutPedidosTable.numeroPedido,
      processamentosPedidosFidelidadeTable.situacao,
      processamentosPedidosFidelidadeTable.updatedAt,
    )
    .orderBy(desc(processamentosPedidosFidelidadeTable.updatedAt))
    .limit(filtros.porPagina)
    .offset((pagina - 1) * filtros.porPagina);

  return {
    configuracao: normalizarConfiguracao(configuracao ?? null),
    saldos: {
      disponiveis: Number(totais?.disponiveis ?? 0),
      pendentes: Number(totais?.pendentes ?? 0),
      acumulado: Number(totais?.acumulado ?? 0),
      revertidos: Number(totais?.revertidos ?? 0),
      reservados: Number(totais?.reservados ?? 0),
      utilizados: Number(totais?.utilizados ?? 0),
    },
    movimentos: linhas.flatMap((linha) =>
      linha.situacao === "nao_elegivel"
        ? []
        : [
            {
              pedidoId: linha.pedidoId,
              numeroPedido: linha.numeroPedido,
              pontos: Number(linha.pontos),
              situacao: linha.situacao,
              data: linha.data,
            },
          ],
    ),
    paginacao: { pagina, porPagina: filtros.porPagina, total, totalPaginas },
  };
}

type ConfiguracaoBanco =
  typeof configuracoesProgramaFidelidadeTable.$inferSelect;

function normalizarConfiguracao(configuracao: ConfiguracaoBanco | null) {
  if (!configuracao) return null;
  return {
    ativo: configuracao.ativo,
    nomePublico: configuracao.nomePublico,
    pontosConversao: Number(configuracao.pontosConversao),
    valorCreditoEmCentavos: configuracao.valorCreditoEmCentavos,
    minimoResgate: Number(configuracao.minimoPontosResgate),
    mesesValidade: configuracao.mesesValidade,
  };
}

function montarResultadoVazio(
  configuracao: ConfiguracaoBanco | null,
  filtros: FiltrosHistoricoFidelidadeCliente,
): ProgramaFidelidadeCliente {
  return {
    configuracao: normalizarConfiguracao(configuracao),
    saldos: {
      disponiveis: 0,
      pendentes: 0,
      acumulado: 0,
      revertidos: 0,
      reservados: 0,
      utilizados: 0,
    },
    movimentos: [],
    paginacao: {
      pagina: 1,
      porPagina: filtros.porPagina,
      total: 0,
      totalPaginas: 1,
    },
  };
}
