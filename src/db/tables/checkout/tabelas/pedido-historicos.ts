import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  checkoutPedidoHistoricoOrigemEnum,
  checkoutPedidoHistoricoTipoEnum,
  checkoutPedidoStatusEnum,
} from "../enums";
import { checkoutPedidosTable } from "./pedidos";

export const checkoutPedidoHistoricosTable = pgTable(
  "checkout_pedido_historicos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    tipo: checkoutPedidoHistoricoTipoEnum("tipo").notNull(),
    descricao: text("descricao").notNull(),
    origem: checkoutPedidoHistoricoOrigemEnum("origem").notNull(),
    statusAnterior: checkoutPedidoStatusEnum("status_anterior"),
    statusNovo: checkoutPedidoStatusEnum("status_novo"),

    // ============================================
    // AUTORIA (quem fez a ação)
    // ============================================
    /**
     * `origem` só diz "system" ou "admin" — insuficiente para auditar dinheiro:
     * não responde QUAL admin deu baixa em um pagamento recebido em mãos.
     *
     * Ambas nullable porque histórico gerado pelo sistema (webhook, expiração)
     * não tem admin. O e-mail fica gravado ao lado do id de propósito: se a conta
     * do admin for removida, o id vira inútil mas a auditoria continua legível.
     *
     * Sem FK para `user`, seguindo o padrão de `checkout_clientes.userId` — arquivo
     * de tabela não referencia outro domínio; a relação é declarada em `relacoes.ts`.
     */
    usuarioAdminId: text("usuario_admin_id"),
    usuarioAdminEmail: text("usuario_admin_email"),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_pedido_historicos_pedido_id_idx").on(table.pedidoId),
    index("checkout_pedido_historicos_tipo_idx").on(table.tipo),
    index("checkout_pedido_historicos_created_at_idx").on(table.createdAt),
  ],
);
