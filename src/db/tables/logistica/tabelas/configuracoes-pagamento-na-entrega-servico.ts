import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { servicosFreteTable } from "./servicos-frete";

/**
 * Configuração de "pagamento na entrega" de UM serviço de frete.
 *
 * Por que uma tabela separada em vez de colunas em `servicos_frete`?
 * `servicos_frete` descreve capacidade logística (peso e dimensões máximos, quem
 * transporta). Pagamento é outro assunto: regra financeira e de risco. Manter os
 * dois separados evita inchar a tabela de frete com colunas que a maioria dos
 * serviços (Correios, Jadlog) nunca vai usar — nenhum deles aceita pagar na entrega.
 *
 * Relação 1:1 com o serviço, garantida pelo `uniqueIndex` em `servicoFreteId`:
 * um serviço tem no máximo uma configuração. A ausência de linha significa
 * "serviço sem configuração" — e o motor de elegibilidade trata isso como
 * bloqueio, nunca como permissão. Isso é o opt-in valendo também aqui.
 */
export const configuracoesPagamentoNaEntregaServicoTable = pgTable(
  "configuracoes_pagamento_na_entrega_servico",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Serviço de frete configurado.
     * `cascade`: apagar o serviço apaga a configuração — ela não faz sentido sozinha.
     */
    servicoFreteId: uuid("servico_frete_id")
      .notNull()
      .references(() => servicosFreteTable.id, { onDelete: "cascade" }),

    /**
     * Chave-mestra do serviço. Desligada aqui, nenhuma forma vale,
     * mesmo que as booleanas abaixo estejam todas true.
     */
    aceitaPagamentoNaEntrega: boolean("aceita_pagamento_na_entrega")
      .notNull()
      .default(false),

    // ============================================
    // FORMAS ACEITAS
    // ============================================
    /**
     * Uma coluna booleana por forma, e não um array de texto.
     * Espelha o padrão já usado em `configuracoes_pagamento`
     * (`pixAtivo`/`cartaoAtivo`/`boletoAtivo`): dá tipagem forte, permite índice
     * e impede valor inválido entrar no banco — um array de texto aceitaria
     * qualquer string.
     */
    aceitaDinheiro: boolean("aceita_dinheiro").notNull().default(false),
    aceitaPixNaEntrega: boolean("aceita_pix_na_entrega").notNull().default(false),
    aceitaDebito: boolean("aceita_debito").notNull().default(false),
    aceitaCredito: boolean("aceita_credito").notNull().default(false),

    // ============================================
    // FAIXA DE VALOR (todas em centavos, todas opcionais)
    // ============================================
    /**
     * `null` = sem limite. Centavos (integer) e nunca decimal, seguindo o
     * padrão de todo o projeto — dinheiro em ponto flutuante acumula erro.
     */
    valorMinimoPedidoEmCentavos: integer("valor_minimo_pedido_em_centavos"),
    valorMaximoPedidoEmCentavos: integer("valor_maximo_pedido_em_centavos"),

    /**
     * Teto específico para dinheiro vivo, independente do teto geral.
     * Existe porque dinheiro tem um risco que maquininha não tem: o entregador
     * circula com o valor. Estourar este limite derruba SÓ a forma `dinheiro`;
     * as demais continuam disponíveis.
     */
    valorMaximoDinheiroEmCentavos: integer("valor_maximo_dinheiro_em_centavos"),

    /**
     * Se o entregador leva troco. Quando false, o cliente precisa ter o valor exato
     * e a interface não oferece o campo de troco.
     */
    exigeTroco: boolean("exige_troco").notNull().default(true),

    /**
     * Texto livre exibido ao cliente no checkout (ex.: procedimento de conferência
     * do PIX antes de liberar a mercadoria). Fica no snapshot do pedido.
     */
    observacoesCliente: text("observacoes_cliente"),

    /**
     * Desliga a configuração inteira sem apagar a linha, preservando o histórico
     * de como ela estava. Mesmo idioma do `ativo` das demais tabelas de logística.
     */
    ativo: boolean("ativo").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "configuracoes_pagamento_na_entrega_servico_servico_unique",
    ).on(table.servicoFreteId),
    index("configuracoes_pagamento_na_entrega_servico_ativo_idx").on(
      table.ativo,
    ),
  ],
);
