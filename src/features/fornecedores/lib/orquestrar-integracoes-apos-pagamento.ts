export type StatusPagamentoParaIntegracoes =
  | "pending"
  | "paid"
  | "failed"
  | "expired";

export type DependenciasIntegracoesAposPagamento<T> = {
  processarLaquila(pedidoId: string): Promise<readonly T[]>;
};

/**
 * Porta independente do gateway para o processamento dos fornecedores.
 *
 * O status recebido por esta regra sempre deve ter sido relido do banco pelo
 * chamador. Assim, nenhum payload de navegador ou do próprio webhook consegue
 * iniciar uma integração antes de o pagamento estar persistido como aprovado.
 */
export async function orquestrarIntegracoesAposPagamento<T>({
  pedidoId,
  pagamentoStatus,
  dependencias,
}: {
  pedidoId: string;
  pagamentoStatus: StatusPagamentoParaIntegracoes;
  dependencias: DependenciasIntegracoesAposPagamento<T>;
}) {
  if (pagamentoStatus !== "paid") {
    return {
      estado: "ignorado_pagamento_nao_confirmado" as const,
      integracoes: [] as readonly T[],
    };
  }

  const integracoes = await dependencias.processarLaquila(pedidoId);

  return {
    estado:
      integracoes.length > 0
        ? ("processado" as const)
        : ("sem_integracao_fornecedor" as const),
    integracoes,
  };
}
