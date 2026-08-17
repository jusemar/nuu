import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { checkoutClientesTable } from "./checkout/tabelas/clientes";
import { checkoutPedidoItensTable } from "./checkout/tabelas/pedido-itens";
import { checkoutPedidosTable } from "./checkout/tabelas/pedidos";

export const fidelidadeSituacaoProcessamentoEnum = pgEnum(
  "fidelidade_situacao_processamento",
  ["nao_elegivel", "pendente", "disponivel", "revertido"],
);

export const fidelidadeTipoTransacaoEnum = pgEnum("fidelidade_tipo_transacao", [
  "credito_pendente",
  "liberacao",
  "reversao_pendente",
  "reversao_disponivel",
  "reserva_resgate",
  "consumo_resgate",
  "liberacao_resgate",
  "devolucao_resgate",
]);

export const fidelidadeStatusTransacaoEnum = pgEnum(
  "fidelidade_status_transacao",
  [
    "pendente",
    "disponivel",
    "revertido",
    "reservada",
    "consumida",
    "liberada",
    "devolvida",
  ],
);

export const fidelidadeStatusReservaEnum = pgEnum("fidelidade_status_reserva", [
  "reservada",
  "consumida",
  "liberada",
  "devolvida",
]);

export const fidelidadeOrigemRegraEnum = pgEnum("fidelidade_origem_regra", [
  "global",
  "personalizada",
]);

/** Totais materializados; o histórico abaixo continua sendo a fonte auditável. */
export const carteirasFidelidadeTable = pgTable(
  "programa_fidelidade_carteiras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "restrict" }),
    pontosPendentes: numeric("pontos_pendentes", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    pontosDisponiveis: numeric("pontos_disponiveis", {
      precision: 18,
      scale: 4,
    })
      .notNull()
      .default("0"),
    pontosReservados: numeric("pontos_reservados", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    pontosUtilizados: numeric("pontos_utilizados", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    pontosRevertidos: numeric("pontos_revertidos", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    totalAcumuladoHistorico: numeric("total_acumulado_historico", {
      precision: 18,
      scale: 4,
    })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("programa_fidelidade_carteira_cliente_unique").on(
      table.clienteId,
    ),
    check(
      "programa_fidelidade_carteira_saldos_nao_negativos",
      sql`${table.pontosPendentes} >= 0 AND ${table.pontosDisponiveis} >= 0 AND ${table.pontosReservados} >= 0 AND ${table.pontosUtilizados} >= 0 AND ${table.pontosRevertidos} >= 0 AND ${table.totalAcumuladoHistorico} >= 0`,
    ),
  ],
);

export const reservasFidelidadeTable = pgTable(
  "programa_fidelidade_reservas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    carteiraId: uuid("carteira_id")
      .notNull()
      .references(() => carteirasFidelidadeTable.id, { onDelete: "restrict" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "restrict" }),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "restrict" }),
    status: fidelidadeStatusReservaEnum("status").notNull(),
    pontos: numeric("pontos", { precision: 18, scale: 4 }).notNull(),
    creditoEmCentavos: integer("credito_em_centavos").notNull(),
    pontosConversao: numeric("pontos_conversao", {
      precision: 18,
      scale: 4,
    }).notNull(),
    valorCreditoConversaoEmCentavos: integer(
      "valor_credito_conversao_em_centavos",
    ).notNull(),
    configuracaoVersao: integer("configuracao_versao").notNull(),
    baseElegivelEmCentavos: integer("base_elegivel_em_centavos").notNull(),
    limiteAplicadoEmCentavos: integer("limite_aplicado_em_centavos").notNull(),
    valorMinimoPagamentoEmCentavos: integer(
      "valor_minimo_pagamento_em_centavos",
    ).notNull(),
    referenciaIdempotencia: text("referencia_idempotencia").notNull(),
    motivoFinalizacao: text("motivo_finalizacao"),
    consumidaEm: timestamp("consumida_em", { withTimezone: true }),
    liberadaEm: timestamp("liberada_em", { withTimezone: true }),
    devolvidaEm: timestamp("devolvida_em", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("programa_fidelidade_reserva_pedido_unique").on(table.pedidoId),
    uniqueIndex("programa_fidelidade_reserva_referencia_unique").on(
      table.referenciaIdempotencia,
    ),
    index("programa_fidelidade_reserva_cliente_status_idx").on(
      table.clienteId,
      table.status,
    ),
    check(
      "programa_fidelidade_reserva_pontos_positivos",
      sql`${table.pontos} > 0`,
    ),
    check(
      "programa_fidelidade_reserva_valores_validos",
      sql`${table.creditoEmCentavos} > 0 AND ${table.baseElegivelEmCentavos} >= ${table.creditoEmCentavos} AND ${table.limiteAplicadoEmCentavos} >= ${table.creditoEmCentavos} AND ${table.valorMinimoPagamentoEmCentavos} > 0`,
    ),
  ],
);

/** Estado idempotente de um pedido no domínio de fidelidade. */
export const processamentosPedidosFidelidadeTable = pgTable(
  "programa_fidelidade_processamentos_pedidos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "restrict" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "restrict" }),
    situacao: fidelidadeSituacaoProcessamentoEnum("situacao").notNull(),
    motivo: text("motivo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("programa_fidelidade_processamento_pedido_unique").on(
      table.pedidoId,
    ),
    index("programa_fidelidade_processamento_cliente_idx").on(table.clienteId),
  ],
);

/** Ledger append-only das movimentações de pontos. */
export const transacoesFidelidadeTable = pgTable(
  "programa_fidelidade_transacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    carteiraId: uuid("carteira_id")
      .notNull()
      .references(() => carteirasFidelidadeTable.id, { onDelete: "restrict" }),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "restrict" }),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "restrict" }),
    reservaId: uuid("reserva_id").references(
      (): AnyPgColumn => reservasFidelidadeTable.id,
      { onDelete: "restrict" },
    ),
    pedidoItemId: uuid("pedido_item_id").references(
      () => checkoutPedidoItensTable.id,
      { onDelete: "restrict" },
    ),
    transacaoOrigemId: uuid("transacao_origem_id").references(
      (): AnyPgColumn => transacoesFidelidadeTable.id,
      { onDelete: "restrict" },
    ),
    categoriaId: uuid("categoria_id"),
    tipo: fidelidadeTipoTransacaoEnum("tipo").notNull(),
    status: fidelidadeStatusTransacaoEnum("status").notNull(),
    referenciaIdempotencia: text("referencia_idempotencia").notNull(),
    origemRegra: fidelidadeOrigemRegraEnum("origem_regra").notNull(),
    configuracaoVersao: integer("configuracao_versao").notNull(),
    taxaPontosPorReal: numeric("taxa_pontos_por_real", {
      precision: 12,
      scale: 4,
    }).notNull(),
    valorBrutoEmCentavos: numeric("valor_bruto_em_centavos", {
      precision: 18,
      scale: 0,
    }).notNull(),
    descontoRateadoEmCentavos: numeric("desconto_rateado_em_centavos", {
      precision: 18,
      scale: 0,
    }).notNull(),
    valorBaseEmCentavos: numeric("valor_base_em_centavos", {
      precision: 18,
      scale: 0,
    }).notNull(),
    pontos: numeric("pontos", { precision: 18, scale: 4 }).notNull(),
    motivo: text("motivo"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("programa_fidelidade_transacao_referencia_unique").on(
      table.referenciaIdempotencia,
    ),
    index("programa_fidelidade_transacao_cliente_data_idx").on(
      table.clienteId,
      table.createdAt,
    ),
    index("programa_fidelidade_transacao_pedido_idx").on(table.pedidoId),
    check(
      "programa_fidelidade_transacao_pontos_positivos",
      sql`${table.pontos} > 0`,
    ),
    check(
      "programa_fidelidade_transacao_valores_validos",
      sql`${table.valorBrutoEmCentavos} >= 0 AND ${table.descontoRateadoEmCentavos} >= 0 AND ${table.valorBaseEmCentavos} >= 0 AND ${table.valorBaseEmCentavos} = ${table.valorBrutoEmCentavos} - ${table.descontoRateadoEmCentavos}`,
    ),
  ],
);

export const carteirasFidelidadeRelations = relations(
  carteirasFidelidadeTable,
  ({ one, many }) => ({
    cliente: one(checkoutClientesTable, {
      fields: [carteirasFidelidadeTable.clienteId],
      references: [checkoutClientesTable.id],
    }),
    transacoes: many(transacoesFidelidadeTable),
  }),
);

export const transacoesFidelidadeRelations = relations(
  transacoesFidelidadeTable,
  ({ one, many }) => ({
    carteira: one(carteirasFidelidadeTable, {
      fields: [transacoesFidelidadeTable.carteiraId],
      references: [carteirasFidelidadeTable.id],
    }),
    origem: one(transacoesFidelidadeTable, {
      fields: [transacoesFidelidadeTable.transacaoOrigemId],
      references: [transacoesFidelidadeTable.id],
      relationName: "reversaoFidelidade",
    }),
    reversoes: many(transacoesFidelidadeTable, {
      relationName: "reversaoFidelidade",
    }),
    cliente: one(checkoutClientesTable, {
      fields: [transacoesFidelidadeTable.clienteId],
      references: [checkoutClientesTable.id],
    }),
    pedido: one(checkoutPedidosTable, {
      fields: [transacoesFidelidadeTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
    itemPedido: one(checkoutPedidoItensTable, {
      fields: [transacoesFidelidadeTable.pedidoItemId],
      references: [checkoutPedidoItensTable.id],
    }),
  }),
);

export const processamentosPedidosFidelidadeRelations = relations(
  processamentosPedidosFidelidadeTable,
  ({ one }) => ({
    cliente: one(checkoutClientesTable, {
      fields: [processamentosPedidosFidelidadeTable.clienteId],
      references: [checkoutClientesTable.id],
    }),
    pedido: one(checkoutPedidosTable, {
      fields: [processamentosPedidosFidelidadeTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
  }),
);
