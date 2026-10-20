"use server";

import { eq } from "drizzle-orm";

import { checkoutClientesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";

import {
  calcularPreviaTotaisPedidoInterno,
  type EntradaCalcularPreviaTotaisPedidoInterno,
} from "./calcular-previa-totais-pedido-interno";

export type {
  ResultadoCalcularPreviaTotaisPedido,
  ResultadoFreteGratisPromocionalPedido,
  TotalPreviaFormaPagamento,
} from "./calcular-previa-totais-pedido-interno";
type EntradaCalcularPreviaTotaisPedidoPublica = Omit<
  EntradaCalcularPreviaTotaisPedidoInterno,
  "checkoutClienteId"
>;

/**
 * Fronteira pública da prévia. A identidade nunca vem da entrada do navegador:
 * quando a fidelidade é consultada, ela é resolvida exclusivamente pela sessão.
 */
export async function calcularPreviaTotaisPedido(
  entrada: EntradaCalcularPreviaTotaisPedidoPublica,
) {
  let checkoutClienteId: string | null = null;

  if (entrada.consultarFidelidade) {
    const sessao = await buscarSessaoCliente();
    const cliente = sessao
      ? await dbTransacional.query.checkoutClientesTable.findFirst({
          where: eq(checkoutClientesTable.userId, sessao.usuario.id),
        })
      : null;
    checkoutClienteId = cliente?.id ?? null;
  }

  return calcularPreviaTotaisPedidoInterno({
    ...entrada,
    checkoutClienteId,
  });
}
