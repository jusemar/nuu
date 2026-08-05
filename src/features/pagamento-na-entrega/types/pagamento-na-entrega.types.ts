/**
 * Contratos do motor de elegibilidade de Pagamento na Entrega.
 *
 * Este arquivo não importa nada do banco, do React ou de outra feature de propósito.
 * O motor precisa rodar em três lugares muito diferentes — página de produto, carrinho e
 * checkout — e cada um deles carrega os dados de um jeito. Se os tipos dependessem da
 * camada de banco, a PDP acabaria importando checkout, que é exatamente o acoplamento
 * que este desenho evita.
 */

/**
 * Onde a avaliação está acontecendo.
 *
 * Muda apenas o quanto de informação existe, nunca a regra:
 * - `pdp` e `carrinho` normalmente ainda não têm total oficial nem endereço, então a
 *   resposta é uma prévia (`decisaoParcial: true`) que só serve para exibir um selo;
 * - `checkout` tem tudo, e só ali a decisão pode ser final.
 */
export type ContextoAvaliacaoPagamentoNaEntrega = "pdp" | "carrinho" | "checkout";

/** As quatro formas de pagar no momento do recebimento. */
export type FormaPagamentoNaEntrega =
  | "dinheiro"
  | "pix_na_entrega"
  | "debito_entrega"
  | "credito_entrega";

/**
 * Modalidade comercial do produto, nos valores exatos gravados em `product_pricing.type`.
 * A V1 aceita somente `stock` — ver `MODALIDADES_COMERCIAIS_SUPORTADAS_PADRAO`.
 */
export type ModalidadeComercialCanonica =
  | "stock"
  | "pre_sale"
  | "dropshipping"
  | "order_basis";

/** Onde o motivo se aplica: no pedido inteiro, num item específico ou numa forma de pagamento. */
export type EscopoMotivoPagamentoNaEntrega = "pedido" | "item" | "forma";

/** Todos os motivos que o motor sabe emitir. União fechada para que o compilador cobre o uso. */
export type CodigoMotivoPagamentoNaEntrega =
  | "configuracao-global-desativada"
  | "carrinho-vazio"
  | "frete-nao-escolhido"
  | "servico-entrega-nao-suportado"
  | "carrinho-com-fretes-divergentes"
  | "servico-sem-configuracao"
  | "servico-inativo"
  | "servico-com-pagamento-desativado"
  | "nenhuma-forma-habilitada"
  | "produto-nao-habilitado"
  | "modalidade-comercial-nao-suportada"
  | "endereco-nao-informado"
  | "cep-divergente-do-frete"
  | "valor-abaixo-do-minimo"
  | "valor-acima-do-maximo"
  | "valor-acima-do-limite-dinheiro"
  | "avaliacao-parcial-sem-total";

export type MotivoPagamentoNaEntrega = {
  codigo: CodigoMotivoPagamentoNaEntrega;
  mensagem: string;
  escopo: EscopoMotivoPagamentoNaEntrega;
  /** Preenchido quando o motivo nasce de um item específico do carrinho. */
  itemCarrinhoId?: string;
  produtoId?: string;
  /** Preenchido quando o motivo derruba apenas uma forma, sem bloquear o pedido. */
  forma?: FormaPagamentoNaEntrega;
};

/**
 * O frete já escolhido para um item.
 *
 * `null` significa "o cliente ainda não escolheu". No checkout este dado vem sempre do
 * snapshot produzido pelo servidor, nunca do carrinho em localStorage — o carrinho é
 * editável pelo usuário e não pode decidir se um pedido pode ou não ser pago na entrega.
 */
export type FreteEscolhidoItemPagamentoNaEntrega = {
  /** Identificador do provedor, ex.: `entrega-propria`, `frenet`, `retirada`. */
  provedor: string;
  /** Identificador do serviço, ex.: `entrega-propria-atual`, `entrega-programada`. */
  servico: string;
  /** CEP usado na cotação. Serve para detectar que o endereço mudou depois da escolha. */
  cepCotado: string | null;
};

export type ItemAvaliacaoPagamentoNaEntrega = {
  itemCarrinhoId: string;
  produtoId: string;
  varianteId: string | null;
  /** Flag do produto (`product.aceita_pagamento_na_entrega`). */
  produtoAceitaPagamentoNaEntrega: boolean;
  /** Flag da variante. `null` significa herdar do produto — nunca "não". */
  varianteAceitaPagamentoNaEntrega: boolean | null;
  /** Valor de `product_pricing.type`. `null` quando o produto não tem modalidade definida. */
  modalidadeComercial: string | null;
  frete: FreteEscolhidoItemPagamentoNaEntrega | null;
};

/**
 * Configuração de pagamento na entrega de um serviço de frete, já achatada com os dados
 * do próprio serviço. Espelha `configuracoes_pagamento_na_entrega_servico` + `servicos_frete`.
 */
export type ConfiguracaoPagamentoNaEntregaServico = {
  id: string;
  servicoFreteId: string;
  servicoIdentificador: string;
  servicoNome: string;
  /** `servicos_frete.ativo` — o serviço em si pode estar desligado. */
  servicoAtivo: boolean;
  /** Chave-mestra: desligada, nenhuma forma vale. */
  aceitaPagamentoNaEntrega: boolean;
  aceitaDinheiro: boolean;
  aceitaPixNaEntrega: boolean;
  aceitaDebito: boolean;
  aceitaCredito: boolean;
  valorMinimoPedidoEmCentavos: number | null;
  valorMaximoPedidoEmCentavos: number | null;
  /** Teto só do dinheiro vivo. Estourar derruba a forma `dinheiro`, não o pedido. */
  valorMaximoDinheiroEmCentavos: number | null;
  exigeTroco: boolean;
  observacoesCliente: string | null;
  /** `ativo` da própria configuração — desliga sem apagar a linha. */
  ativo: boolean;
  atualizadoEm: string | null;
};

export type EntradaAvaliacaoPagamentoNaEntrega = {
  contexto: ContextoAvaliacaoPagamentoNaEntrega;
  itens: ItemAvaliacaoPagamentoNaEntrega[];
  /** Total oficial do pedido. `null` em PDP e carrinho, onde ainda não existe. */
  totalPedidoEmCentavos: number | null;
  /** CEP de entrega informado no checkout. `null` quando ainda não há endereço. */
  cepEntrega: string | null;
  /** Kill-switch global (`configuracoes_pagamento.pagamento_na_entrega_ativo`). */
  configuracaoGlobalAtiva: boolean;
  configuracoesPorServico: ConfiguracaoPagamentoNaEntregaServico[];
  /** Por parâmetro para permitir ampliar sem reescrever o motor. Padrão: só `stock`. */
  modalidadesComerciaisSuportadas?: readonly ModalidadeComercialCanonica[];
  /**
   * Instante da avaliação, em ISO 8601, fornecido por quem chama.
   *
   * É parâmetro e não `new Date()` interno justamente para o motor continuar puro: a mesma
   * entrada sempre produz a mesma saída, o que torna o snapshot reproduzível e o teste
   * determinístico.
   */
  avaliadoEm: string;
};

export type ServicoAvaliadoPagamentoNaEntrega = {
  servicoFreteId: string;
  identificador: string;
  nome: string;
};

export type RegrasAplicadasPagamentoNaEntrega = {
  configuracaoId: string;
  valorMinimoEmCentavos: number | null;
  valorMaximoEmCentavos: number | null;
  valorMaximoDinheiroEmCentavos: number | null;
  exigeTroco: boolean;
  observacoesCliente: string | null;
  modalidadesSuportadas: ModalidadeComercialCanonica[];
  configuracaoAtualizadaEm: string | null;
};

export type LimitesPagamentoNaEntrega = {
  valorMinimoEmCentavos: number | null;
  valorMaximoEmCentavos: number | null;
  valorMaximoDinheiroEmCentavos: number | null;
  exigeTroco: boolean;
};

export type ResultadoAvaliacaoPagamentoNaEntrega = {
  versao: "1";
  /** `true` somente quando a decisão é final E positiva. Prévia nunca é elegível. */
  elegivel: boolean;
  /** `true` quando faltou contexto (total ou endereço) para decidir de verdade. */
  decisaoParcial: boolean;
  formasPermitidas: FormaPagamentoNaEntrega[];
  motivos: MotivoPagamentoNaEntrega[];
  servico: ServicoAvaliadoPagamentoNaEntrega | null;
  regrasAplicadas: RegrasAplicadasPagamentoNaEntrega | null;
  limites: LimitesPagamentoNaEntrega;
  /** `true` sempre que a decisão não pode ser usada para criar pedido sem reavaliar. */
  exigeRevalidacao: boolean;
  totalAvaliadoEmCentavos: number | null;
  cepAvaliado: string | null;
  avaliadoEm: string;
};

// ============================================
// CONSISTÊNCIA DE TROCO
// ============================================

export type CodigoProblemaTrocoPedido =
  | "troco-para-forma-nao-dinheiro"
  | "troco-informado-sem-necessidade"
  | "troco-ausente"
  | "troco-menor-que-total"
  | "total-do-pedido-divergente";

export type ProblemaTrocoPedido = {
  codigo: CodigoProblemaTrocoPedido;
  mensagem: string;
};

export type EntradaConsistenciaTrocoPedido = {
  formaEscolhida: FormaPagamentoNaEntrega;
  precisaTroco: boolean;
  trocoParaEmCentavos: number | null;
  /** Total congelado no pedido, calculado no servidor na criação. */
  valorAReceberEmCentavos: number;
  /**
   * Total do pedido no momento da leitura. Quando difere do congelado, alguém mexeu no
   * pedido depois e o troco combinado com o cliente pode não fechar mais.
   */
  totalAtualDoPedidoEmCentavos: number | null;
};

export type ResultadoConsistenciaTrocoPedido = {
  consistente: boolean;
  problemas: ProblemaTrocoPedido[];
  /** Positivo quando o total atual subiu; negativo quando caiu. `null` se não há com o que comparar. */
  divergenciaDeTotalEmCentavos: number | null;
  /** Quanto o entregador precisa devolver. `null` quando não há troco a calcular. */
  trocoADevolverEmCentavos: number | null;
};
