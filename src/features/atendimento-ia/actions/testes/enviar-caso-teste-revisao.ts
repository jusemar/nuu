"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { enviarCasoTesteRevisaoSchema } from "../../schemas/admin/caso-teste.schema";
import { atendimentoIaCasoTesteVersoesTable } from "./auxiliares";
export async function enviarCasoTesteRevisao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = enviarCasoTesteRevisaoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const agora = new Date();
    const [v] = await tx
      .update(atendimentoIaCasoTesteVersoesTable)
      .set({
        estado: "em_revisao",
        enviadoRevisaoPorId: ator.usuarioId,
        enviadoRevisaoEm: agora,
        revisadoPorId: null,
        revisadoEm: null,
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(atendimentoIaCasoTesteVersoesTable.id, d.versaoId),
          eq(atendimentoIaCasoTesteVersoesTable.estado, "rascunho"),
          eq(
            atendimentoIaCasoTesteVersoesTable.atualizadoEm,
            d.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaCasoTesteVersoesTable.id });
    if (!v) throw new Error("RASCUNHO_DESATUALIZADO");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "enviar_caso_teste_revisao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_teste_enviado_revisao",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
