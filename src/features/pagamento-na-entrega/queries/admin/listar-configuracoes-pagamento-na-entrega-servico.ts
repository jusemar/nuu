import "server-only";

import {
  carregarKillSwitchPagamentoNaEntrega,
  carregarServicosComConfiguracaoPagamentoNaEntrega,
  type ServicoComConfiguracaoPagamentoNaEntrega,
} from "../carregar-configuracoes-pagamento-na-entrega";

/** Uma linha da tela administrativa. */
export type LinhaConfiguracaoPagamentoNaEntregaAdmin =
  ServicoComConfiguracaoPagamentoNaEntrega;

export type PainelPagamentoNaEntregaAdmin = {
  /** Kill-switch global. Enquanto `false`, nada disso aparece para o cliente. */
  pagamentoNaEntregaAtivoGlobalmente: boolean;
  linhas: LinhaConfiguracaoPagamentoNaEntregaAdmin[];
};

/**
 * Carrega o painel administrativo de pagamento na entrega.
 *
 * A consulta em si vive em `carregar-configuracoes-pagamento-na-entrega.ts`, compartilhada
 * com o motor de elegibilidade. Assim a tela mostra exatamente a mesma configuração que a
 * loja aplica — não há como as duas leituras divergirem.
 *
 * Não há `try/catch` engolindo erro de tabela ausente: se
 * `configuracoes_pagamento_na_entrega_servico` não existir, a migration 0015 não foi
 * aplicada naquele ambiente, e é exatamente isso que precisa aparecer.
 */
export async function listarConfiguracoesPagamentoNaEntregaServico(): Promise<PainelPagamentoNaEntregaAdmin> {
  const [linhas, pagamentoNaEntregaAtivoGlobalmente] = await Promise.all([
    carregarServicosComConfiguracaoPagamentoNaEntrega(),
    carregarKillSwitchPagamentoNaEntrega(),
  ]);

  return { pagamentoNaEntregaAtivoGlobalmente, linhas };
}
