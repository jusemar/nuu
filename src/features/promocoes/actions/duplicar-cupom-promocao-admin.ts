"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { cuponsPromocaoTable } from "../../../db/schema";
import { dbTransacional } from "../../../db/transaction";
import { idPromocaoAdminSchema } from "../schemas";

function criarCodigoDuplicado(codigo: string) {
  return `${codigo}_COPIA_${Date.now().toString(36).toUpperCase()}`;
}

export async function duplicarCupomPromocaoAdmin(id: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.MARKETING.ADMINISTRAR);
  const cupomId = idPromocaoAdminSchema.parse(id);
  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    const cupom = await tx.query.cuponsPromocaoTable.findFirst({
      where: eq(cuponsPromocaoTable.id, cupomId),
    });

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    await tx.insert(cuponsPromocaoTable).values({
      codigo: criarCodigoDuplicado(cupom.codigo),
      nome: `${cupom.nome} (cópia)`,
      ativo: false,
      tipoDesconto: cupom.tipoDesconto,
      valorDesconto: cupom.valorDesconto,
      freteGratis: cupom.freteGratis,
      prioridade: cupom.prioridade,
      acumulativo: cupom.acumulativo,
      subtotalMinimo: cupom.subtotalMinimo,
      limiteUsoTotal: cupom.limiteUsoTotal,
      limiteUsoPorCliente: cupom.limiteUsoPorCliente,
      totalUsos: 0,
      dataInicio: cupom.dataInicio,
      dataFim: cupom.dataFim,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  });

  revalidatePath("/admin/marketing/cupons");

  return { success: true };
}
