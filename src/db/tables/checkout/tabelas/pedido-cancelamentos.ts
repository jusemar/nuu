import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  checkoutCancelamentoMotivoEnum,
  checkoutCancelamentoStatusEnum,
  checkoutPagamentoGatewayEnum,
  checkoutReembolsoStatusEnum,
} from "../enums";
import { checkoutPedidosTable } from "./pedidos";

/** Registro único e auditável da decisão financeira de cancelamento do pedido. */
export const checkoutPedidoCancelamentosTable = pgTable(
  "checkout_pedido_cancelamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "restrict" }),
    status: checkoutCancelamentoStatusEnum("status").notNull(),
    motivo: checkoutCancelamentoMotivoEnum("motivo").notNull(),
    complementoMotivo: text("complemento_motivo"),
    solicitadoPorUsuarioId: text("solicitado_por_usuario_id").notNull(),
    solicitadoPorEmail: text("solicitado_por_email").notNull(),
    solicitadoEm: timestamp("solicitado_em").notNull().defaultNow(),
    concluidoEm: timestamp("concluido_em"),
    gatewayReembolso: checkoutPagamentoGatewayEnum("gateway_reembolso"),
    reembolsoStatus: checkoutReembolsoStatusEnum("reembolso_status")
      .notNull()
      .default("nao_necessario"),
    reembolsoId: text("reembolso_id"),
    chaveIdempotenciaReembolso: text("chave_idempotencia_reembolso").notNull(),
    erroOperacional: text("erro_operacional"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("checkout_pedido_cancelamentos_pedido_unique").on(
      table.pedidoId,
    ),
    uniqueIndex("checkout_pedido_cancelamentos_reembolso_unique").on(
      table.chaveIdempotenciaReembolso,
    ),
    index("checkout_pedido_cancelamentos_status_idx").on(table.status),
    index("checkout_pedido_cancelamentos_reembolso_status_idx").on(
      table.reembolsoStatus,
    ),
  ],
);
