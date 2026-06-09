"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { cuponsPromocaoTable } from "../../../db/schema";
import { dbTransacional } from "../../../db/transaction";
import { salvarCupomPromocaoAdminSchema } from "../schemas";

function revalidarCuponsAdmin() {
  revalidatePath("/admin/marketing/cupons");
}

export async function salvarCupomPromocaoAdmin(entrada: unknown) {
  const dados = salvarCupomPromocaoAdminSchema.parse(entrada);
  const agora = new Date();
  const valoresCupom = {
    codigo: dados.codigo,
    nome: dados.nome,
    ativo: dados.ativo,
    tipoDesconto: dados.tipoDesconto,
    valorDesconto: dados.valorDesconto,
    freteGratis: dados.freteGratis,
    prioridade: dados.prioridade,
    acumulativo: dados.acumulativo,
    subtotalMinimo: dados.subtotalMinimo,
    limiteUsoTotal: dados.limiteUsoTotal ?? null,
    limiteUsoPorCliente: dados.limiteUsoPorCliente ?? null,
    dataInicio: dados.dataInicio,
    dataFim: dados.dataFim ?? null,
    atualizadoEm: agora,
  };

  await dbTransacional.transaction(async (tx) => {
    if (dados.id) {
      await tx
        .update(cuponsPromocaoTable)
        .set(valoresCupom)
        .where(eq(cuponsPromocaoTable.id, dados.id));
      return;
    }

    await tx.insert(cuponsPromocaoTable).values({
      ...valoresCupom,
      totalUsos: 0,
      criadoEm: agora,
    });
  });

  revalidarCuponsAdmin();

  return { success: true };
}
