import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { checkoutPedidosTable } from "./pedidos";

export type SnapshotFretePedidoLogistica = {
  versao: "1";
  cep: string;
  valorTotalEmCentavos: number;
  fallbackAcionado: boolean;
  itens: Array<{
    itemCarrinhoId: string;
    produtoId: string;
    varianteId: string | null;
    provedor: string;
    servico: string;
    modalidade: string;
    valorEmCentavos: number;
    prazo: string | null;
    itensLogisticos: unknown[];
    pacotes: unknown[];
    metadataResumida: Record<string, unknown> | null;
    fallbackAcionado: boolean;
  }>;
};

export const checkoutPedidoLogisticasTable = pgTable(
  "checkout_pedido_logisticas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),
    transportadora: text("transportadora"),
    provedorFrete: text("provedor_frete"),
    modalidadeFrete: text("modalidade_frete"),
    valorFreteEmCentavos: integer("valor_frete_em_centavos"),
    prazoFrete: text("prazo_frete"),
    cepFrete: text("cep_frete"),
    fallbackFreteUtilizado: boolean("fallback_frete_utilizado")
      .notNull()
      .default(false),
    snapshotFrete:
      jsonb("snapshot_frete").$type<SnapshotFretePedidoLogistica>(),
    codigoRastreio: text("codigo_rastreio"),
    dataEnvio: timestamp("data_envio"),
    dataEntrega: timestamp("data_entrega"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("checkout_pedido_logisticas_pedido_id_unique").on(
      table.pedidoId,
    ),
    index("checkout_pedido_logisticas_codigo_rastreio_idx").on(
      table.codigoRastreio,
    ),
  ],
);
