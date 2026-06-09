import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import {
  checkoutClientesTable,
  checkoutEfiWebhookEventosTable,
  checkoutPagamentosTable,
  checkoutPedidosTable,
  checkoutStripeWebhookEventosTable,
  cuponsPromocaoTable,
  usosCuponsPromocaoTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { filtrosAuditoriaCuponsAdminSchema } from "../schemas";
import type {
  InconsistenciaAuditoriaCupomAdmin,
  ResultadoAuditoriaCuponsAdmin,
  UsoCupomAuditoriaAdmin,
} from "../types";

type FiltrosAuditoriaCuponsAdmin = {
  busca?: string;
  codigoCupom?: string;
  numeroPedido?: string;
  cliente?: string;
  statusPagamento?: string;
  pagina?: number;
  limite?: number;
};

type LinhaUsoCupomAuditoria = {
  id: string;
  codigoCupom: string;
  cupomId: string;
  pedidoId: string | null;
  numeroPedido: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  clienteEmail: string | null;
  descontoAplicadoEmCentavos: number;
  gateway: string | null;
  metodoPagamento: string | null;
  statusPagamento: "pending" | "paid" | "failed" | "expired" | null;
  dataUso: Date;
};

function criarCondicoesAuditoriaCupons(filtros: FiltrosAuditoriaCuponsAdmin) {
  const condicoes: SQL[] = [];

  if (filtros.busca?.trim()) {
    condicoes.push(
      or(
        ilike(usosCuponsPromocaoTable.codigoCupom, `%${filtros.busca}%`),
        ilike(checkoutPedidosTable.numeroPedido, `%${filtros.busca}%`),
        ilike(checkoutClientesTable.nome, `%${filtros.busca}%`),
        ilike(checkoutClientesTable.email, `%${filtros.busca}%`),
      )!,
    );
  }

  if (filtros.codigoCupom?.trim()) {
    condicoes.push(
      ilike(usosCuponsPromocaoTable.codigoCupom, `%${filtros.codigoCupom}%`),
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
        checkoutPagamentosTable.status,
        filtros.statusPagamento as "pending" | "paid" | "failed" | "expired",
      ),
    );
  }

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

export function obterOrigemGatewayWebhook({
  gateway,
  statusPagamento,
}: {
  gateway: string | null;
  statusPagamento: string | null;
}) {
  if (statusPagamento !== "paid") return "Pagamento não aprovado";
  if (gateway === "stripe") return "Stripe webhook/sincronização";
  if (gateway === "efibank") return "Efí Pix webhook";
  return "Gateway não identificado";
}

function mapearUsoAuditoria(
  linha: LinhaUsoCupomAuditoria,
): UsoCupomAuditoriaAdmin {
  return {
    ...linha,
    origemGatewayWebhook: obterOrigemGatewayWebhook({
      gateway: linha.gateway,
      statusPagamento: linha.statusPagamento,
    }),
  };
}

async function buscarPedidosPagosSemUso(): Promise<
  InconsistenciaAuditoriaCupomAdmin[]
> {
  const linhas = await dbTransacional
    .select({
      id: checkoutPedidosTable.id,
      numeroPedido: checkoutPedidosTable.numeroPedido,
      codigoCupom: checkoutPedidosTable.codigoCupomAplicado,
      criadoEm: checkoutPedidosTable.createdAt,
    })
    .from(checkoutPedidosTable)
    .leftJoin(
      usosCuponsPromocaoTable,
      eq(usosCuponsPromocaoTable.pedidoId, checkoutPedidosTable.id),
    )
    .where(
      and(
        eq(checkoutPedidosTable.pagamentoStatus, "paid"),
        isNotNull(checkoutPedidosTable.codigoCupomAplicado),
        gt(checkoutPedidosTable.descontoCupomEmCentavos, 0),
        isNull(usosCuponsPromocaoTable.id),
      ),
    )
    .orderBy(desc(checkoutPedidosTable.createdAt))
    .limit(20);

  return linhas.map((linha) => ({
    id: `pedido-pago-sem-uso-${linha.id}`,
    tipo: "pedido_pago_sem_uso",
    severidade: "alta",
    titulo: "Pedido pago sem uso de cupom registrado",
    descricao:
      "O pedido possui cupom/desconto no snapshot, mas não há uso definitivo registrado.",
    pedidoId: linha.id,
    numeroPedido: linha.numeroPedido,
    codigoCupom: linha.codigoCupom,
    criadoEm: linha.criadoEm,
  }));
}

async function buscarUsosSemPagamentoAprovado(): Promise<
  InconsistenciaAuditoriaCupomAdmin[]
> {
  const linhas = await dbTransacional
    .select({
      id: usosCuponsPromocaoTable.id,
      pedidoId: usosCuponsPromocaoTable.pedidoId,
      codigoCupom: usosCuponsPromocaoTable.codigoCupom,
      numeroPedido: checkoutPedidosTable.numeroPedido,
      criadoEm: usosCuponsPromocaoTable.usadoEm,
    })
    .from(usosCuponsPromocaoTable)
    .leftJoin(
      checkoutPedidosTable,
      eq(checkoutPedidosTable.id, usosCuponsPromocaoTable.pedidoId),
    )
    .leftJoin(
      checkoutPagamentosTable,
      eq(checkoutPagamentosTable.pedidoId, checkoutPedidosTable.id),
    )
    .where(
      or(
        isNull(checkoutPedidosTable.id),
        ne(checkoutPedidosTable.pagamentoStatus, "paid"),
        isNull(checkoutPagamentosTable.id),
        ne(checkoutPagamentosTable.status, "paid"),
      ),
    )
    .orderBy(desc(usosCuponsPromocaoTable.usadoEm))
    .limit(20);

  return linhas.map((linha) => ({
    id: `uso-sem-pagamento-${linha.id}`,
    tipo: "uso_sem_pagamento_aprovado",
    severidade: "alta",
    titulo: "Uso registrado sem pagamento aprovado",
    descricao:
      "Existe uso de cupom sem pedido/pagamento confirmado como aprovado.",
    pedidoId: linha.pedidoId,
    numeroPedido: linha.numeroPedido,
    codigoCupom: linha.codigoCupom,
    criadoEm: linha.criadoEm,
  }));
}

async function buscarDuplicidadesUso(): Promise<
  InconsistenciaAuditoriaCupomAdmin[]
> {
  const linhas = await dbTransacional
    .select({
      pedidoId: usosCuponsPromocaoTable.pedidoId,
      cupomId: usosCuponsPromocaoTable.cupomPromocaoId,
      codigoCupom: usosCuponsPromocaoTable.codigoCupom,
      total: count(),
    })
    .from(usosCuponsPromocaoTable)
    .groupBy(
      usosCuponsPromocaoTable.pedidoId,
      usosCuponsPromocaoTable.cupomPromocaoId,
      usosCuponsPromocaoTable.codigoCupom,
    )
    .having(sql`count(*) > 1`)
    .limit(20);

  return linhas.map((linha) => ({
    id: `uso-duplicado-${linha.pedidoId}-${linha.cupomId}`,
    tipo: "uso_duplicado",
    severidade: "alta",
    titulo: "Uso duplicado detectado",
    descricao: `Foram encontrados ${linha.total} usos para o mesmo pedido/cupom.`,
    pedidoId: linha.pedidoId,
    codigoCupom: linha.codigoCupom,
  }));
}

async function buscarFalhasWebhook(): Promise<
  InconsistenciaAuditoriaCupomAdmin[]
> {
  const [falhasStripe, falhasEfi] = await Promise.all([
    dbTransacional
      .select({
        id: checkoutStripeWebhookEventosTable.id,
        pedidoId: checkoutStripeWebhookEventosTable.pedidoId,
        criadoEm: checkoutStripeWebhookEventosTable.createdAt,
        erro: checkoutStripeWebhookEventosTable.erro,
      })
      .from(checkoutStripeWebhookEventosTable)
      .where(eq(checkoutStripeWebhookEventosTable.statusProcessamento, "erro"))
      .orderBy(desc(checkoutStripeWebhookEventosTable.createdAt))
      .limit(10),
    dbTransacional
      .select({
        id: checkoutEfiWebhookEventosTable.id,
        pedidoId: checkoutEfiWebhookEventosTable.pedidoId,
        criadoEm: checkoutEfiWebhookEventosTable.createdAt,
        erro: checkoutEfiWebhookEventosTable.erro,
      })
      .from(checkoutEfiWebhookEventosTable)
      .where(eq(checkoutEfiWebhookEventosTable.statusProcessamento, "erro"))
      .orderBy(desc(checkoutEfiWebhookEventosTable.createdAt))
      .limit(10),
  ]);

  return [
    ...falhasStripe.map((linha) => ({
      id: `webhook-stripe-${linha.id}`,
      tipo: "webhook_com_falha" as const,
      severidade: "media" as const,
      titulo: "Webhook Stripe com falha",
      descricao: linha.erro ?? "Evento Stripe marcado com erro.",
      pedidoId: linha.pedidoId,
      criadoEm: linha.criadoEm,
    })),
    ...falhasEfi.map((linha) => ({
      id: `webhook-efi-${linha.id}`,
      tipo: "webhook_com_falha" as const,
      severidade: "media" as const,
      titulo: "Webhook Efí com falha",
      descricao: linha.erro ?? "Evento Efí marcado com erro.",
      pedidoId: linha.pedidoId,
      criadoEm: linha.criadoEm,
    })),
  ];
}

export async function buscarInconsistenciasAuditoriaCuponsAdmin(): Promise<
  InconsistenciaAuditoriaCupomAdmin[]
> {
  const [
    pedidosPagosSemUso,
    usosSemPagamentoAprovado,
    duplicidades,
    falhasWebhook,
  ] = await Promise.all([
    buscarPedidosPagosSemUso(),
    buscarUsosSemPagamentoAprovado(),
    buscarDuplicidadesUso(),
    buscarFalhasWebhook(),
  ]);

  return [
    ...pedidosPagosSemUso,
    ...usosSemPagamentoAprovado,
    ...duplicidades,
    ...falhasWebhook,
  ];
}

export async function listarAuditoriaCuponsAdmin(
  filtrosEntrada: FiltrosAuditoriaCuponsAdmin = {},
): Promise<ResultadoAuditoriaCuponsAdmin> {
  const filtros = filtrosAuditoriaCuponsAdminSchema.parse(filtrosEntrada);
  const condicoes = criarCondicoesAuditoriaCupons(filtros);
  const deslocamento = (filtros.pagina - 1) * filtros.limite;

  const [
    totalResultado,
    resumoResultado,
    cuponsMaisUsados,
    usos,
    inconsistencias,
  ] = await Promise.all([
    dbTransacional
      .select({ total: count() })
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
      .where(condicoes),
    dbTransacional
      .select({
        totalUsosRegistrados: count(),
        totalDescontoRegistradoEmCentavos: sql<number>`coalesce(sum(${usosCuponsPromocaoTable.valorDescontoEmCentavos}), 0)`,
      })
      .from(usosCuponsPromocaoTable),
    dbTransacional
      .select({
        codigoCupom: usosCuponsPromocaoTable.codigoCupom,
        totalUsos: count(),
        totalDescontoEmCentavos: sql<number>`coalesce(sum(${usosCuponsPromocaoTable.valorDescontoEmCentavos}), 0)`,
      })
      .from(usosCuponsPromocaoTable)
      .groupBy(usosCuponsPromocaoTable.codigoCupom)
      .orderBy(desc(count()))
      .limit(5),
    dbTransacional
      .select({
        id: usosCuponsPromocaoTable.id,
        codigoCupom: usosCuponsPromocaoTable.codigoCupom,
        cupomId: usosCuponsPromocaoTable.cupomPromocaoId,
        pedidoId: usosCuponsPromocaoTable.pedidoId,
        numeroPedido: checkoutPedidosTable.numeroPedido,
        clienteId: checkoutClientesTable.id,
        clienteNome: checkoutClientesTable.nome,
        clienteEmail: checkoutClientesTable.email,
        descontoAplicadoEmCentavos:
          usosCuponsPromocaoTable.valorDescontoEmCentavos,
        gateway: checkoutPagamentosTable.gateway,
        metodoPagamento: checkoutPagamentosTable.metodo,
        statusPagamento: checkoutPagamentosTable.status,
        dataUso: usosCuponsPromocaoTable.usadoEm,
      })
      .from(usosCuponsPromocaoTable)
      .innerJoin(
        cuponsPromocaoTable,
        eq(cuponsPromocaoTable.id, usosCuponsPromocaoTable.cupomPromocaoId),
      )
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
      .limit(filtros.limite)
      .offset(deslocamento),
    buscarInconsistenciasAuditoriaCuponsAdmin(),
  ]);
  const total = totalResultado[0]?.total ?? 0;
  const totalPedidosPagosSemUso = inconsistencias.filter(
    (inconsistencia) => inconsistencia.tipo === "pedido_pago_sem_uso",
  ).length;
  const totalUsosSemPagamentoAprovado = inconsistencias.filter(
    (inconsistencia) => inconsistencia.tipo === "uso_sem_pagamento_aprovado",
  ).length;
  const totalDuplicidades = inconsistencias.filter(
    (inconsistencia) => inconsistencia.tipo === "uso_duplicado",
  ).length;
  const totalWebhooksComFalha = inconsistencias.filter(
    (inconsistencia) => inconsistencia.tipo === "webhook_com_falha",
  ).length;

  return {
    usos: usos.map(mapearUsoAuditoria),
    inconsistencias,
    resumo: {
      totalUsosRegistrados: resumoResultado[0]?.totalUsosRegistrados ?? 0,
      totalDescontoRegistradoEmCentavos:
        resumoResultado[0]?.totalDescontoRegistradoEmCentavos ?? 0,
      cuponsMaisUsados: cuponsMaisUsados.map((cupom) => ({
        codigoCupom: cupom.codigoCupom,
        totalUsos: cupom.totalUsos,
        totalDescontoEmCentavos: cupom.totalDescontoEmCentavos,
      })),
      totalPedidosPagosSemUso,
      totalUsosSemPagamentoAprovado,
      totalDuplicidades,
      totalWebhooksComFalha,
    },
    total,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.limite)),
  };
}
