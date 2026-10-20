import { formatarPontosCliente } from "@/features/programa-fidelidade/lib/formatar-fidelidade-cliente";

/** Mantém o item estável para visitantes e acrescenta somente o saldo disponível. */
export function montarRotuloTrocaPontos(
  saldoDisponivel: number | null | undefined,
) {
  if (saldoDisponivel === null || saldoDisponivel === undefined) {
    return "Troque seus pontos";
  }

  return `Troque seus pontos · ${formatarPontosCliente(saldoDisponivel)} pts`;
}
