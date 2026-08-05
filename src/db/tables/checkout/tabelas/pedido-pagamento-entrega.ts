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

// Importa o módulo concreto de cada tabela, nunca o barrel do domínio (`../../logistica`).
// O barrel reexporta também as `relacoes.ts`, que por sua vez importam outras tabelas —
// puxá-lo de dentro de um arquivo de tabela abriria caminho para import circular.
// É o mesmo estilo de `servicos-frete.ts`, que importa `./provedores-frete` diretamente.
import { userTable } from "../../autenticacao/tabelas/usuarios";
import { servicosFreteTable } from "../../logistica/tabelas/servicos-frete";
import { checkoutPagamentoNaEntregaFormaEnum } from "../enums";
import { checkoutPedidosTable } from "./pedidos";

/**
 * Retrato congelado da decisão de elegibilidade no instante em que o pedido nasceu.
 *
 * O tipo é declarado aqui, junto da tabela, e não importado de
 * `features/pagamento-na-entrega` — a camada de banco não pode depender de feature
 * (a dependência é sempre feature → banco). Mesmo padrão de
 * `SnapshotFretePedidoLogistica` em `pedido-logisticas.ts`.
 *
 * Por que congelar em vez de recalcular na leitura? Porque a configuração do serviço
 * muda com o tempo. Se o gestor baixar o teto de dinheiro amanhã, um pedido criado
 * hoje dentro da regra antiga continua legítimo — e o admin precisa conseguir ver
 * exatamente qual regra o autorizou.
 */
export type SnapshotElegibilidadePagamentoNaEntrega = {
  versao: "1";
  elegivel: boolean;
  decisaoParcial: boolean;
  formasPermitidas: string[];
  motivos: Array<{
    codigo: string;
    mensagem: string;
    escopo: "pedido" | "item" | "forma";
    itemCarrinhoId?: string;
    produtoId?: string;
    forma?: string;
  }>;
  servico: {
    servicoFreteId: string;
    identificador: string;
    nome: string;
  } | null;
  regrasAplicadas: {
    configuracaoId: string;
    valorMinimoEmCentavos: number | null;
    valorMaximoEmCentavos: number | null;
    valorMaximoDinheiroEmCentavos: number | null;
    exigeTroco: boolean;
    observacoesCliente: string | null;
    modalidadesSuportadas: string[];
    configuracaoAtualizadaEm: string | null;
  } | null;
  totalAvaliadoEmCentavos: number | null;
  cepAvaliado: string | null;
  avaliadoEm: string;
};

export const checkoutPedidoPagamentoEntregaTable = pgTable(
  "checkout_pedido_pagamento_entrega",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * O `uniqueIndex` abaixo torna a relação 1:1 com o pedido.
     * Isso não é só modelagem: é a primeira camada de idempotência. Uma segunda
     * tentativa de inserir a mesma linha esbarra na constraint em vez de duplicar
     * a cobrança.
     */
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => checkoutPedidosTable.id, { onDelete: "cascade" }),

    /** Forma escolhida pelo cliente, restrita no banco às 4 formas válidas. */
    formaEscolhida:
      checkoutPagamentoNaEntregaFormaEnum("forma_escolhida").notNull(),

    // ============================================
    // SERVIÇO QUE AUTORIZOU O PAGAMENTO NA ENTREGA
    // ============================================
    /**
     * `set null`: apagar um serviço de frete não pode apagar nem quebrar o pedido.
     * Por isso a coluna é anulável e vem acompanhada do identificador denormalizado.
     */
    servicoFreteId: uuid("servico_frete_id").references(
      () => servicosFreteTable.id,
      { onDelete: "set null" },
    ),

    /**
     * Cópia do identificador do serviço (ex.: "entrega-propria-atual").
     * Denormalizado de propósito: sobrevive à exclusão do serviço e permite ler o
     * pedido sem join.
     */
    servicoIdentificador: text("servico_identificador").notNull(),

    // ============================================
    // VALORES
    // ============================================
    /**
     * Total OFICIAL a receber, calculado no servidor dentro da transação de criação
     * do pedido. Nunca vem do cliente.
     */
    valorAReceberEmCentavos: integer("valor_a_receber_em_centavos").notNull(),

    /**
     * Declaração do cliente: "vou pagar com uma nota de X".
     * `trocoParaEmCentavos` só faz sentido com `precisaTroco = true` e forma
     * `dinheiro`; as demais combinações são inválidas e barradas na action.
     */
    precisaTroco: boolean("precisa_troco").notNull().default(false),
    trocoParaEmCentavos: integer("troco_para_em_centavos"),

    /** Cópia das instruções exibidas ao cliente, congelada junto do resto. */
    observacoesCliente: text("observacoes_cliente"),

    /** Justificativa completa da decisão — ver o tipo acima. */
    snapshotElegibilidade: jsonb("snapshot_elegibilidade")
      .$type<SnapshotElegibilidadePagamentoNaEntrega>()
      .notNull(),

    // ============================================
    // BAIXA MANUAL (preenchida pelo admin no recebimento)
    // ============================================
    /**
     * Enquanto `recebidoEm` é null, o dinheiro não entrou. É também a terceira
     * camada de idempotência da confirmação: a action só age quando isso é null.
     */
    recebidoEm: timestamp("recebido_em"),

    /**
     * Quem deu a baixa. `set null` na exclusão do usuário, mas o e-mail fica
     * gravado ao lado — auditoria de dinheiro não pode evaporar porque uma conta
     * de admin foi removida.
     */
    recebidoPorUsuarioId: text("recebido_por_usuario_id").references(
      () => userTable.id,
      { onDelete: "set null" },
    ),
    recebidoPorEmail: text("recebido_por_email"),

    /**
     * Valor efetivamente recebido, informado explicitamente pelo admin.
     * Coluna separada de `valorAReceberEmCentavos` de propósito: divergência entre
     * as duas é justamente o que a conferência de caixa precisa enxergar.
     */
    valorRecebidoEmCentavos: integer("valor_recebido_em_centavos"),
    observacaoRecebimento: text("observacao_recebimento"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("checkout_pedido_pagamento_entrega_pedido_id_unique").on(
      table.pedidoId,
    ),
    index("checkout_pedido_pagamento_entrega_recebido_em_idx").on(
      table.recebidoEm,
    ),
    index("checkout_pedido_pagamento_entrega_servico_frete_id_idx").on(
      table.servicoFreteId,
    ),
  ],
);
