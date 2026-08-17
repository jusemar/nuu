import type { StatusFornecedorPedidoIntegracao } from "@/db/schema";

export function decidirExecucaoPedidoLaquila(entrada: {
  status: StatusFornecedorPedidoIntegracao;
  hashPersistido: string;
  hashAtual: string;
}): "adquirir" | "reutilizar" | "hash_divergente" {
  if (entrada.hashPersistido !== entrada.hashAtual) return "hash_divergente";

  return entrada.status === "pendente" || entrada.status === "falha"
    ? "adquirir"
    : "reutilizar";
}
