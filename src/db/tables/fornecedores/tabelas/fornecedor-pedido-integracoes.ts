import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { checkoutPedidosTable } from "../../checkout/tabelas/pedidos";
import { fornecedorIntegracaoApiProvedorEnum } from "../enums";
import { fornecedoresTable } from "./fornecedores";

export type StatusFornecedorPedidoIntegracao =
  | "pendente"
  | "processando"
  | "criado"
  | "falha"
  | "resultado_indeterminado";

/** Controle operacional de um grupo fornecedor dentro do pedido da loja. */
export const fornecedorPedidoIntegracoesTable = pgTable(
  "fornecedor_pedido_integracoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "restrict" }),
    provedor: fornecedorIntegracaoApiProvedorEnum("provedor").notNull(),
    chaveGrupo: text("chave_grupo").notNull(),
    chaveIdempotencia: text("chave_idempotencia").notNull(),
    hashPayload: text("hash_payload").notNull(),
    status: text("status").$type<StatusFornecedorPedidoIntegracao>().notNull(),
    idPedidoExterno: text("id_pedido_externo"),
    cdTransportador: text("cd_transportador").notNull(),
    tentativas: integer("tentativas").notNull().default(0),
    ultimaTentativaEm: timestamp("ultima_tentativa_em"),
    erroSanitizado: text("erro_sanitizado"),
    payloadSanitizado: jsonb("payload_sanitizado")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fornecedor_pedido_integracoes_grupo_unique").on(
      table.pedidoId,
      table.provedor,
      table.chaveGrupo,
    ),
    uniqueIndex("fornecedor_pedido_integracoes_idempotencia_unique").on(
      table.chaveIdempotencia,
    ),
    uniqueIndex("fornecedor_pedido_integracoes_externo_unique")
      .on(table.provedor, table.idPedidoExterno)
      .where(sql`${table.idPedidoExterno} is not null`),
    index("fornecedor_pedido_integracoes_status_idx").on(table.status),
  ],
);

export type FornecedorPedidoIntegracao =
  typeof fornecedorPedidoIntegracoesTable.$inferSelect;
export type NovaFornecedorPedidoIntegracao =
  typeof fornecedorPedidoIntegracoesTable.$inferInsert;
