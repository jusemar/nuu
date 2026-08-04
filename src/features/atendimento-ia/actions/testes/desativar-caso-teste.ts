"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { desativarCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";
export async function desativarCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = desativarCasoTesteSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    await tx
      .update(atendimentoIaCasosTesteTable)
      .set({ ativo: false, atualizadoEm: new Date() })
      .where(eq(atendimentoIaCasosTesteTable.id, d.casoTesteId));
    await tx
      .update(atendimentoIaCasoTesteVersoesTable)
      .set({ estado: "desativado", atualizadoEm: new Date() })
      .where(eq(atendimentoIaCasoTesteVersoesTable.casoTesteId, d.casoTesteId));
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "desativar_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_teste_desativado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
