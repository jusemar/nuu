export const VERSAO_FERRAMENTAS_PROTEGIDAS = "1.0.0";
export const VALIDADE_CONFIRMACAO_PROTEGIDA_MS_PADRAO = 5 * 60 * 1_000;

export const FERRAMENTAS_AUTENTICADAS_ATIVAS = [
  "listar_pedidos_cliente",
  "consultar_pedido_cliente",
  "acompanhar_pedido_cliente",
  "consultar_enderecos_cliente",
] as const;

export const OPERACOES_CONFIRMADAS_BLOQUEADAS = [
  "solicitar_cancelamento_pedido",
  "alterar_endereco_pedido",
  "alterar_status_pedido",
] as const;

export const OPERACOES_PROIBIDAS = [
  "alterar_preco",
  "alterar_estoque",
  "alterar_promocao",
  "alterar_cupom",
  "conceder_desconto",
  "aprovar_pagamento",
  "executar_funcao_administrativa",
  "alterar_usuario_permissao",
  "executar_comando_arbitrario",
] as const;
