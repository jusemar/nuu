import type {
  CodigoMotivoPagamentoNaEntrega,
  EstadoKillSwitchPagamentoNaEntrega,
  EstadoRecebimentoPagamentoEntrega,
  EstadoSalvarConfiguracaoPagamentoNaEntrega,
  FormaPagamentoNaEntrega,
  ModalidadeComercialCanonica,
} from "../types/pagamento-na-entrega.types";

/**
 * Identificador do provedor de entrega própria em `provedores_frete`.
 *
 * É o único provedor que pode aceitar pagamento na entrega: só nele quem entrega é a
 * própria loja, com um entregador que consegue receber o dinheiro. Transportadora
 * (Frenet) e retirada no balcão ficam de fora da V1.
 */
export const PROVEDOR_ENTREGA_PROPRIA = "entrega-propria";

/**
 * Modalidades comerciais aceitas na V1.
 *
 * Só `stock` porque é a única em que a loja tem o item em mãos e entrega com meio próprio.
 * `dropshipping` conflita na estrutura (quem envia é o fornecedor). `pre_sale` e
 * `order_basis` criam um intervalo longo entre o pedido e o recebimento, com risco de o
 * cliente recusar depois do custo já incorrido.
 */
export const MODALIDADES_COMERCIAIS_SUPORTADAS_PADRAO: readonly ModalidadeComercialCanonica[] =
  ["stock"];

/** Ordem estável de apresentação das formas. Evita a interface trocar de ordem sozinha. */
export const ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA: readonly FormaPagamentoNaEntrega[] =
  ["dinheiro", "pix_na_entrega", "debito_entrega", "credito_entrega"];

export const ROTULO_FORMA_PAGAMENTO_NA_ENTREGA: Record<
  FormaPagamentoNaEntrega,
  string
> = {
  dinheiro: "Dinheiro",
  pix_na_entrega: "PIX na entrega",
  debito_entrega: "Cartão de débito",
  credito_entrega: "Cartão de crédito",
};

/**
 * Mensagens dos motivos, em texto que pode ser lido por um humano.
 *
 * Ficam centralizadas aqui, e não espalhadas pelo motor, para que a decisão (o código) e a
 * explicação (o texto) evoluam separadamente: reescrever uma mensagem não deve exigir
 * mexer na regra nem refazer os testes, que asseveram códigos.
 */
export const MENSAGEM_MOTIVO_PAGAMENTO_NA_ENTREGA: Record<
  CodigoMotivoPagamentoNaEntrega,
  string
> = {
  "configuracao-global-desativada":
    "Pagamento na entrega está desativado na loja.",
  "carrinho-vazio": "Não há itens para avaliar.",
  "frete-nao-escolhido":
    "Escolha a forma de entrega para ver se o pagamento na entrega está disponível.",
  "servico-entrega-nao-suportado":
    "Pagamento na entrega vale apenas para as entregas feitas pela própria loja.",
  "carrinho-com-fretes-divergentes":
    "Os itens do pedido usam formas de entrega diferentes. Pagamento na entrega exige uma única forma para todo o pedido.",
  "servico-sem-configuracao":
    "Esta forma de entrega ainda não tem pagamento na entrega configurado.",
  "servico-inativo": "Esta forma de entrega está indisponível no momento.",
  "servico-com-pagamento-desativado":
    "Esta forma de entrega não aceita pagamento na entrega.",
  "nenhuma-forma-habilitada":
    "Nenhuma forma de pagamento na entrega está disponível para este pedido.",
  "produto-nao-habilitado":
    "Um dos produtos do pedido não aceita pagamento na entrega.",
  "produto-origem-fornecedor-indisponivel":
    "Indisponível para produtos enviados desta origem.",
  "modalidade-comercial-nao-suportada":
    "Um dos produtos do pedido é vendido em uma modalidade que não aceita pagamento na entrega.",
  "endereco-nao-informado":
    "Informe o endereço de entrega para confirmar o pagamento na entrega.",
  "cep-divergente-do-frete":
    "O CEP mudou depois da escolha da entrega. Refaça o cálculo do frete.",
  "valor-abaixo-do-minimo":
    "O valor do pedido está abaixo do mínimo aceito para pagamento na entrega.",
  "valor-acima-do-maximo":
    "O valor do pedido está acima do máximo aceito para pagamento na entrega.",
  "valor-acima-do-limite-dinheiro":
    "O valor do pedido ultrapassa o limite aceito em dinheiro.",
  "avaliacao-parcial-sem-total":
    "A disponibilidade será confirmada no checkout.",
};

/**
 * Texto exato do indicador que aparece dentro do card da modalidade de entrega na PDP.
 *
 * Substituiu o aviso solto do topo da área comercial, que precisava explicar "para formas
 * de entrega própria selecionadas" justamente por não estar ao lado de nenhuma delas. Com o
 * indicador dentro do card, a modalidade é o próprio contexto e o texto pode ser curto.
 */
export const ROTULO_BADGE_PAGAMENTO_NA_ENTREGA =
  "Pagamento na entrega disponível";

// -----------------------------------------------------------------------------
// Estados iniciais das Server Actions do admin
// -----------------------------------------------------------------------------
// Ficam aqui, e não junto das actions, porque um arquivo `"use server"` só pode exportar
// funções async — exportar o objeto de estado inicial dali derruba a requisição em tempo de
// execução. Os tipos correspondentes estão em `types/pagamento-na-entrega.types.ts`.

/** Estado inicial da chave geral, antes de qualquer submissão. */
export const ESTADO_INICIAL_KILL_SWITCH: EstadoKillSwitchPagamentoNaEntrega = {
  sucesso: false,
  mensagem: null,
};

/** Estado inicial do formulário de configuração por serviço. */
export const ESTADO_INICIAL_SALVAR_CONFIGURACAO_PAGAMENTO_NA_ENTREGA: EstadoSalvarConfiguracaoPagamentoNaEntrega =
  { sucesso: false, mensagem: null, servicoFreteId: null };

/** Estado inicial das ações de baixa: confirmar, não receber e estornar. */
export const ESTADO_INICIAL_RECEBIMENTO_PAGAMENTO_ENTREGA: EstadoRecebimentoPagamentoEntrega =
  { sucesso: false, mensagem: null };
