export function classificarSessaoStripeParaReconciliacao({
  status,
  pagamentoStatus,
}: {
  status: "open" | "complete" | "expired" | null;
  pagamentoStatus: "paid" | "unpaid" | "no_payment_required";
}) {
  if (pagamentoStatus === "paid") return "confirmar" as const;
  if (status === "expired") return "expirar" as const;
  return "manter_pendente" as const;
}

export function pixPodeExpirar({
  status,
  expiraEm,
  agora,
}: {
  status: "pending" | "paid" | "failed" | "expired";
  expiraEm: Date | null;
  agora: Date;
}) {
  return status === "pending" && expiraEm !== null && expiraEm <= agora;
}
