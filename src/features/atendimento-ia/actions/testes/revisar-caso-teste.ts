"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { podeAutorDecidir } from "../../lib/admin/revisao/politica-transicao-revisao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { revisarCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";
import {
  atendimentoIaCasoTesteVersoesTable,
  buscarOutrosDecisores,
} from "./auxiliares";
export async function revisarCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("revisoes_decisao");
  const d = revisarCasoTesteSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const [atual] = await tx
      .select({ autor: atendimentoIaCasoTesteVersoesTable.criadoPorId })
      .from(atendimentoIaCasoTesteVersoesTable)
      .where(eq(atendimentoIaCasoTesteVersoesTable.id, d.versaoId))
      .limit(1);
    if (!atual) throw new Error("VERSAO_NAO_DISPONIVEL");
    if (
      !podeAutorDecidir({
        autorId: atual.autor ?? "",
        decisorId: ator.usuarioId,
        outrosDecisoresAtivos: await buscarOutrosDecisores(tx, ator.usuarioId),
      })
    )
      throw new Error("AUTOAPROVACAO_NAO_PERMITIDA");
    const agora = new Date();
    const [v] = await tx
      .update(atendimentoIaCasoTesteVersoesTable)
      .set({
        estado: d.decisao === "aprovada" ? "aprovado" : "rascunho",
        revisadoPorId: ator.usuarioId,
        revisadoEm: agora,
        motivoReprovacao: d.decisao === "reprovada" ? d.motivo : null,
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(atendimentoIaCasoTesteVersoesTable.id, d.versaoId),
          eq(atendimentoIaCasoTesteVersoesTable.estado, "em_revisao"),
          isNull(atendimentoIaCasoTesteVersoesTable.revisadoEm),
          eq(
            atendimentoIaCasoTesteVersoesTable.atualizadoEm,
            d.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaCasoTesteVersoesTable.id });
    if (!v) throw new Error("REVISAO_DESATUALIZADA");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "revisar_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_teste_revisado",
      metadados: { decisao: d.decisao },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
