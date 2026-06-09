import "server-only";

import { and, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutPagamentosTable,
  checkoutPedidosTable,
  usosCuponsPromocaoTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { filtrosExportacaoAuditoriaCuponsAdminSchema } from "../schemas";
import {
  buscarInconsistenciasAuditoriaCuponsAdmin,
  obterOrigemGatewayWebhook,
} from "./listar-auditoria-cupons-admin";

const LIMITE_EXPORTACAO_AUDITORIA_CUPONS = 5000;

type FiltrosExportacaoAuditoriaCuponsAdmin = {
  periodoInicio?: string;
  periodoFim?: string;
  statusPagamento?: string;
  codigoCupom?: string;
  gateway?: string;
  inconsistencia?: string;
};

type LinhaExportacaoUsoCupom = {
  codigoCupom: string;
  pedidoId: string | null;
  numeroPedido: string | null;
  clienteNome: string | null;
  clienteEmail: string | null;
  gateway: string | null;
  statusPagamento: string | null;
  descontoAplicadoEmCentavos: number;
  dataUso: Date;
  origemGatewayWebhook: string;
};

function converterPeriodo(valor?: string, fimDoDia = false) {
  if (!valor) return null;
  const data = new Date(valor);
  if (fimDoDia && !Number.isNaN(data.getTime())) {
    data.setHours(23, 59, 59, 999);
  }
  return Number.isNaN(data.getTime()) ? null : data;
}

function criarCondicoesExportacao(
  filtros: FiltrosExportacaoAuditoriaCuponsAdmin,
) {
  const condicoes: SQL[] = [];
  const periodoInicio = converterPeriodo(filtros.periodoInicio);
  const periodoFim = converterPeriodo(filtros.periodoFim, true);

  if (periodoInicio) {
    condicoes.push(gte(usosCuponsPromocaoTable.usadoEm, periodoInicio));
  }

  if (periodoFim) {
    condicoes.push(lte(usosCuponsPromocaoTable.usadoEm, periodoFim));
  }

  if (filtros.codigoCupom?.trim()) {
    condicoes.push(
      ilike(usosCuponsPromocaoTable.codigoCupom, `%${filtros.codigoCupom}%`),
    );
  }

  if (filtros.statusPagamento && filtros.statusPagamento !== "todos") {
    condicoes.push(
      eq(
        checkoutPagamentosTable.status,
        filtros.statusPagamento as "pending" | "paid" | "failed" | "expired",
      ),
    );
  }

  if (filtros.gateway && filtros.gateway !== "todos") {
    condicoes.push(
      eq(
        checkoutPagamentosTable.gateway,
        filtros.gateway as "stripe" | "efibank",
      ),
    );
  }

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

function escaparCsv(valor: string | number | Date | null | undefined) {
  if (valor === null || valor === undefined) return "";
  const texto = valor instanceof Date ? valor.toISOString() : String(valor);
  const escapado = texto.replaceAll('"', '""');
  return `"${escapado}"`;
}

function montarLinhaCsv(
  colunas: Array<string | number | Date | null | undefined>,
) {
  return colunas.map(escaparCsv).join(",");
}

function formatarCentavos(valor: number) {
  return (valor / 100).toFixed(2).replace(".", ",");
}

function normalizarTipoInconsistencia(tipo?: string) {
  return tipo && tipo !== "todas" ? tipo : null;
}

export async function exportarAuditoriaCuponsAdminCsv(
  filtrosEntrada: FiltrosExportacaoAuditoriaCuponsAdmin = {},
) {
  const filtros =
    filtrosExportacaoAuditoriaCuponsAdminSchema.parse(filtrosEntrada);
  const condicoes = criarCondicoesExportacao(filtros);
  const tipoInconsistencia = normalizarTipoInconsistencia(
    filtros.inconsistencia,
  );
  const [usos, inconsistenciasBase] = await Promise.all([
    dbTransacional
      .select({
        codigoCupom: usosCuponsPromocaoTable.codigoCupom,
        pedidoId: usosCuponsPromocaoTable.pedidoId,
        numeroPedido: checkoutPedidosTable.numeroPedido,
        clienteNome: checkoutClientesTable.nome,
        clienteEmail: checkoutClientesTable.email,
        gateway: checkoutPagamentosTable.gateway,
        statusPagamento: checkoutPagamentosTable.status,
        descontoAplicadoEmCentavos:
          usosCuponsPromocaoTable.valorDescontoEmCentavos,
        dataUso: usosCuponsPromocaoTable.usadoEm,
      })
      .from(usosCuponsPromocaoTable)
      .leftJoin(
        checkoutPedidosTable,
        eq(checkoutPedidosTable.id, usosCuponsPromocaoTable.pedidoId),
      )
      .leftJoin(
        checkoutClientesTable,
        eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
      )
      .leftJoin(
        checkoutPagamentosTable,
        eq(checkoutPagamentosTable.pedidoId, checkoutPedidosTable.id),
      )
      .where(condicoes)
      .orderBy(desc(usosCuponsPromocaoTable.usadoEm))
      .limit(LIMITE_EXPORTACAO_AUDITORIA_CUPONS),
    buscarInconsistenciasAuditoriaCuponsAdmin(),
  ]);
  const inconsistencias = inconsistenciasBase.filter((inconsistencia) => {
    if (tipoInconsistencia && inconsistencia.tipo !== tipoInconsistencia) {
      return false;
    }

    if (filtros.codigoCupom?.trim()) {
      return inconsistencia.codigoCupom
        ?.toLowerCase()
        .includes(filtros.codigoCupom.toLowerCase());
    }

    return true;
  });
  const inconsistenciasPorPedidoCupom = new Map(
    inconsistencias.map((inconsistencia) => [
      `${inconsistencia.pedidoId ?? ""}:${inconsistencia.codigoCupom ?? ""}`,
      inconsistencia,
    ]),
  );
  const cabecalho = [
    "cupom",
    "pedido",
    "cliente",
    "email_cliente",
    "gateway",
    "status_pagamento",
    "desconto",
    "data",
    "inconsistencia",
    "webhook_origem",
  ];
  const linhasUsos = (usos as LinhaExportacaoUsoCupom[]).map((uso) => {
    const inconsistencia = inconsistenciasPorPedidoCupom.get(
      `${uso.pedidoId ?? ""}:${uso.codigoCupom}`,
    );

    return montarLinhaCsv([
      uso.codigoCupom,
      uso.numeroPedido,
      uso.clienteNome,
      uso.clienteEmail,
      uso.gateway,
      uso.statusPagamento,
      formatarCentavos(uso.descontoAplicadoEmCentavos),
      uso.dataUso,
      inconsistencia?.tipo ?? "",
      obterOrigemGatewayWebhook({
        gateway: uso.gateway,
        statusPagamento: uso.statusPagamento,
      }),
    ]);
  });
  const linhasInconsistenciasSemUso = inconsistencias.map((inconsistencia) =>
    montarLinhaCsv([
      inconsistencia.codigoCupom,
      inconsistencia.numeroPedido,
      "",
      "",
      "",
      "",
      "",
      inconsistencia.criadoEm ?? null,
      inconsistencia.tipo,
      inconsistencia.titulo,
    ]),
  );
  const conteudo = [
    montarLinhaCsv(cabecalho),
    ...linhasUsos,
    ...linhasInconsistenciasSemUso,
  ].join("\n");

  return `${conteudo}\n`;
}
