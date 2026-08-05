import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutPedidoStatusEnum = pgEnum("checkout_pedido_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
  "expired",
]);

export const checkoutPedidoHistoricoTipoEnum = pgEnum(
  "checkout_pedido_historico_tipo",
  [
    "pedido_criado",
    "pagamento_aprovado",
    "status_alterado_manual",
    "pedido_enviado",
    "rastreio_atualizado",
    "pedido_entregue",
    // Baixa manual do dinheiro recebido pelo entregador. Sempre no fim da lista:
    // a ordem dos valores de um enum é persistida no Postgres, e inserir no meio
    // exigiria recriar o tipo — o oposto de uma migration aditiva.
    "pagamento_recebido_na_entrega",
  ],
);

export const checkoutPedidoHistoricoOrigemEnum = pgEnum(
  "checkout_pedido_historico_origem",
  ["system", "admin"],
);

export const checkoutPagamentoGatewayEnum = pgEnum(
  "checkout_pagamento_gateway",
  [
    "stripe",
    "efibank",
    // "manual" descreve o canal de liquidação, não um gateway de verdade: o dinheiro
    // entra na mão do entregador e um admin dá baixa depois. Existe porque a coluna
    // `gateway_pagamento` é NOT NULL — e é justamente ele o discriminador que separa
    // um pagamento na entrega de um pagamento online, sem precisar de status novo.
    "manual",
  ],
);

export const checkoutPagamentoMetodoEnum = pgEnum("checkout_pagamento_metodo", [
  "cartao",
  "pix",
  // As 4 formas de pagar no recebimento. Ficam no mesmo enum dos métodos online
  // (e não em uma tabela paralela) para que toda consulta de pagamento continue
  // enxergando um único conjunto de métodos.
  "dinheiro",
  "pix_na_entrega",
  "debito_entrega",
  "credito_entrega",
]);

/**
 * Formas válidas de pagamento na entrega, isoladas em um enum próprio.
 *
 * Por que duplicar os 4 valores que já estão em `checkout_pagamento_metodo`?
 * Porque a coluna `forma_escolhida` do pedido aceita SOMENTE estas quatro. Usar o
 * enum de métodos ali permitiria gravar "pix" ou "cartao" numa linha de pagamento
 * na entrega — um estado sem sentido que o banco deixaria passar.
 */
export const checkoutPagamentoNaEntregaFormaEnum = pgEnum(
  "checkout_pagamento_na_entrega_forma",
  ["dinheiro", "pix_na_entrega", "debito_entrega", "credito_entrega"],
);

export const checkoutPagamentoStatusEnum = pgEnum("checkout_pagamento_status", [
  "pending",
  "paid",
  "failed",
  "expired",
]);
