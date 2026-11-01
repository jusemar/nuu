import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { SnapshotComissaoRepresentante } from "@/features/products/types/comissoes-representantes/comissao-representante.types";

import { userTable } from "../../autenticacao";
import { fornecedoresTable } from "../../fornecedores/tabelas/fornecedores";
import { autorizacoesProdutosRepresentantesTable } from "../../representantes-fornecedores/tabelas";
import { checkoutPedidoItensTable } from "./pedido-itens";
import { checkoutPedidosTable } from "./pedidos";

/** Proposta congelada pelo gestor. Serviços só inserem/leem; eventos não atualizam o snapshot. */
export const checkoutItemComissoesTable = pgTable(
  "checkout_item_comissoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "restrict" }),
    pedidoItemId: uuid("pedido_item_id")
      .notNull()
      .references(() => checkoutPedidoItensTable.id, { onDelete: "restrict" }),
    produtoId: uuid("produto_id").notNull(),
    representanteUsuarioId: text("representante_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    fornecedorId: uuid("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "restrict" }),
    autorizacaoId: uuid("autorizacao_id")
      .notNull()
      .references(() => autorizacoesProdutosRepresentantesTable.id, {
        onDelete: "restrict",
      }),
    snapshot: jsonb("snapshot")
      .$type<SnapshotComissaoRepresentante>()
      .notNull(),
    atribuidoPorUsuarioId: text("atribuido_por_usuario_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("checkout_item_comissoes_item_unico").on(t.pedidoItemId),
    index("checkout_item_comissoes_pedido_idx").on(t.pedidoId),
    // Escopo obrigatório por titular e ordenação/filtro de período do painel.
    index("checkout_item_comissoes_titular_data_idx").on(t.representanteUsuarioId,t.createdAt,t.id),
    index("checkout_item_comissoes_data_idx").on(t.createdAt,t.id),
  ],
);
/** Histórico aditivo: confirmar/cancelar/estornar nunca sobrescreve valores históricos. */
export const checkoutItemComissaoEventosTable = pgTable(
  "checkout_item_comissao_eventos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comissaoId: uuid("comissao_id")
      .notNull()
      .references(() => checkoutItemComissoesTable.id, {
        onDelete: "restrict",
      }),
    tipo: text("tipo")
      .$type<"confirmada" | "cancelada" | "estornada">()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("checkout_item_comissao_evento_unico").on(t.comissaoId, t.tipo),
    check(
      "checkout_item_comissao_evento_valido",
      sql`${t.tipo} IN ('confirmada','cancelada','estornada')`,
    ),
  ],
);
export const checkoutItemComissoesRelations = relations(
  checkoutItemComissoesTable,
  ({ one, many }) => ({
    pedido: one(checkoutPedidosTable, {
      fields: [checkoutItemComissoesTable.pedidoId],
      references: [checkoutPedidosTable.id],
    }),
    item: one(checkoutPedidoItensTable, {
      fields: [checkoutItemComissoesTable.pedidoItemId],
      references: [checkoutPedidoItensTable.id],
    }),
    representante: one(userTable, {
      fields: [checkoutItemComissoesTable.representanteUsuarioId],
      references: [userTable.id],
      relationName: "representanteComissionado",
    }),
    gestor: one(userTable, {
      fields: [checkoutItemComissoesTable.atribuidoPorUsuarioId],
      references: [userTable.id],
      relationName: "gestorAtribuicao",
    }),
    fornecedor: one(fornecedoresTable, {
      fields: [checkoutItemComissoesTable.fornecedorId],
      references: [fornecedoresTable.id],
    }),
    autorizacao: one(autorizacoesProdutosRepresentantesTable, {
      fields: [checkoutItemComissoesTable.autorizacaoId],
      references: [autorizacoesProdutosRepresentantesTable.id],
    }),
    eventos: many(checkoutItemComissaoEventosTable),
  }),
);
export const checkoutItemComissaoEventosRelations = relations(
  checkoutItemComissaoEventosTable,
  ({ one }) => ({
    comissao: one(checkoutItemComissoesTable, {
      fields: [checkoutItemComissaoEventosTable.comissaoId],
      references: [checkoutItemComissoesTable.id],
    }),
  }),
);
