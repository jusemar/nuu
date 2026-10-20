"use server";

import { eq, inArray, sum } from "drizzle-orm";

import { carteirasFidelidadeTable, checkoutClientesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";

/**
 * Consulta enxuta para o cabeçalho. A identidade vem exclusivamente da sessão
 * validada no servidor e o resultado contém somente o saldo disponível agregado.
 */
export async function buscarSaldoDisponivelFidelidadeCabecalho() {
  const sessao = await buscarSessaoCliente();
  if (!sessao) return null;

  const clientes = await dbTransacional
    .select({ id: checkoutClientesTable.id })
    .from(checkoutClientesTable)
    .where(eq(checkoutClientesTable.userId, sessao.usuario.id));
  const clientesIds = clientes.map((cliente) => cliente.id);

  if (clientesIds.length === 0) return 0;

  const [saldo] = await dbTransacional
    .select({
      disponivel: sum(carteirasFidelidadeTable.pontosDisponiveis),
    })
    .from(carteirasFidelidadeTable)
    .where(inArray(carteirasFidelidadeTable.clienteId, clientesIds));

  return Number(saldo?.disponivel ?? 0);
}
