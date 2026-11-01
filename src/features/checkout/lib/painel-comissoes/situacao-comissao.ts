/** Uma única ordem de precedência governa SQL, detalhes e validação de quitação. */
export const REGRAS_SITUACAO_COMISSAO = [
  { situacao: "estornada", algum: ["estornada", "pedidoReembolsado"] },
  { situacao: "cancelada", algum: ["cancelada", "pedidoCancelado"] },
  { situacao: "aguardando_confirmacao", nenhum: ["confirmada"] },
  { situacao: "quitada", algum: ["quitada"] },
] as const;
export type SinalComissao =
  | "estornada"
  | "pedidoReembolsado"
  | "cancelada"
  | "pedidoCancelado"
  | "confirmada"
  | "quitada";
export type SituacaoComissao =
  | (typeof REGRAS_SITUACAO_COMISSAO)[number]["situacao"]
  | "a_receber";
export function derivarSituacaoComissao(
  sinais: Record<SinalComissao, boolean>,
): SituacaoComissao {
  return (
    REGRAS_SITUACAO_COMISSAO.find((r) =>
      "algum" in r
        ? r.algum.some((s) => sinais[s])
        : r.nenhum.every((s) => !sinais[s]),
    )?.situacao ?? "a_receber"
  );
}
export const ROTULOS_SITUACAO: Record<SituacaoComissao, string> = {
  aguardando_confirmacao: "Aguardando confirmação",
  a_receber: "A receber",
  quitada: "Quitada",
  cancelada: "Invalidada por cancelamento",
  estornada: "Invalidada por estorno",
};
