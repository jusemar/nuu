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

import {
  checkoutPagamentoGatewayEnum,
  checkoutPagamentoStatusEnum,
  checkoutPedidoStatusEnum,
} from "../enums";
import { checkoutClientesTable } from "./clientes";
import { checkoutEnderecosTable } from "./enderecos";

export const checkoutPedidosTable = pgTable(
  "checkout_pedidos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    numeroPedido: text("numero_pedido").notNull().unique(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => checkoutClientesTable.id, { onDelete: "restrict" }),
    enderecoId: uuid("endereco_id")
      .notNull()
      .references(() => checkoutEnderecosTable.id, { onDelete: "restrict" }),
    status: checkoutPedidoStatusEnum("status").notNull().default("pending"),
    subtotalEmCentavos: integer("subtotal_em_centavos").notNull(),
    freteEmCentavos: integer("frete_em_centavos").notNull(),
    descontoEmCentavos: integer("desconto_em_centavos").notNull().default(0),
    descontoPromocionalEmCentavos: integer("desconto_promocional_em_centavos")
      .notNull()
      .default(0),
    descontoCupomEmCentavos: integer("desconto_cupom_em_centavos")
      .notNull()
      .default(0),
    economiaTotalEmCentavos: integer("economia_total_em_centavos")
      .notNull()
      .default(0),
    totalEmCentavos: integer("total_em_centavos").notNull(),
    codigoCupomAplicado: text("codigo_cupom_aplicado"),
    pontosResgatados: text("pontos_resgatados"),
    creditoFidelidadeEmCentavos: integer("credito_fidelidade_em_centavos")
      .notNull()
      .default(0),
    pontosConversaoFidelidade: text("pontos_conversao_fidelidade"),
    valorCreditoConversaoEmCentavos: integer(
      "valor_credito_conversao_em_centavos",
    ),
    configuracaoFidelidadeVersao: integer("configuracao_fidelidade_versao"),
    baseElegivelFidelidadeEmCentavos: integer(
      "base_elegivel_fidelidade_em_centavos",
    ),
    limiteFidelidadeAplicadoEmCentavos: integer(
      "limite_fidelidade_aplicado_em_centavos",
    ),
    valorMinimoPagamentoEmCentavos: integer(
      "valor_minimo_pagamento_em_centavos",
    ),
    reservaFidelidadeId: uuid("reserva_fidelidade_id"),
    snapshotDescontos: jsonb("snapshot_descontos"),
    gatewayPagamento:
      checkoutPagamentoGatewayEnum("gateway_pagamento").notNull(),
    pagamentoStatus: checkoutPagamentoStatusEnum("pagamento_status")
      .notNull()
      .default("pending"),
    /**
     * Chave gerada pelo navegador ao abrir o checkout e reenviada em cada tentativa.
     *
     * Existe porque hoje um duplo clique em "finalizar" cria dois pedidos. Com PIX
     * o estrago é pequeno (o segundo expira sozinho); com pagamento na entrega são
     * dois pedidos válidos, e alguém entrega a mercadoria duas vezes.
     *
     * Nullable para não invalidar os pedidos já existentes, e o índice único ignora
     * nulos — então o campo fica completamente inerte até o Bloco 7 passar a
     * preenchê-lo. Adicionado agora só para não precisar de uma segunda migration.
     */
    chaveIdempotencia: text("chave_idempotencia"),
    observacao: text("observacao"),
    observacaoCliente: text("observacao_cliente"),
    autorizarEntregaVizinho: boolean("autorizar_entrega_vizinho")
      .notNull()
      .default(false),
    nomeVizinho: text("nome_vizinho"),
    observacaoVizinho: text("observacao_vizinho"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("checkout_pedidos_cliente_id_idx").on(table.clienteId),
    index("checkout_pedidos_status_idx").on(table.status),
    // No Postgres, um índice único não considera dois NULLs iguais: todos os pedidos
    // atuais (chave nula) convivem sem conflito, e a proteção passa a valer sozinha
    // assim que a chave começar a ser gravada.
    uniqueIndex("checkout_pedidos_chave_idempotencia_unique").on(
      table.chaveIdempotencia,
    ),
  ],
);
