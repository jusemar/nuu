"use server";
import { and, count, eq, inArray, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaPapeisAdminTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { podeAutorDecidir } from "../../lib/admin/revisao/politica-transicao-revisao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { revisarComportamentoSchema } from "../../schemas/admin/comportamento-editor.schema";
export async function revisarComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("revisoes_decisao");
  const d = revisarComportamentoSchema.parse(entrada);
  await dbTransacional.transaction(async (tx) => {
    const [v] = await tx
      .select({ autor: atendimentoIaComportamentoVersoesTable.criadoPorId })
      .from(atendimentoIaComportamentoVersoesTable)
      .where(eq(atendimentoIaComportamentoVersoesTable.id, d.versaoId))
      .limit(1);
    if (!v) throw new Error("VERSAO_NAO_DISPONIVEL");
    const [o] = await tx
      .select({ total: count() })
      .from(atendimentoIaPapeisAdminTable)
      .where(
        and(
          eq(atendimentoIaPapeisAdminTable.ativo, true),
          inArray(atendimentoIaPapeisAdminTable.papel, [
            "gestor_principal",
            "revisor",
          ]),
          ne(atendimentoIaPapeisAdminTable.usuarioId, ator.usuarioId),
        ),
      );
    if (
      !podeAutorDecidir({
        autorId: v.autor ?? "",
        decisorId: ator.usuarioId,
        outrosDecisoresAtivos: o?.total ?? 0,
      })
    )
      throw new Error("AUTOAPROVACAO_NAO_PERMITIDA");
    const agora = new Date();
    const [x] = await tx
      .update(atendimentoIaComportamentoVersoesTable)
      .set({
        estado: d.decisao === "aprovada" ? "em_revisao" : "rascunho",
        revisadoPorId: ator.usuarioId,
        revisadoEm: agora,
        motivoReprovacao: d.decisao === "reprovada" ? d.motivo : null,
        publicacaoBloqueada: d.decisao === "reprovada",
        motivoBloqueio: d.decisao === "reprovada" ? d.motivo : null,
        atualizadoEm: agora,
      })
      .where(
        and(
          eq(atendimentoIaComportamentoVersoesTable.id, d.versaoId),
          eq(atendimentoIaComportamentoVersoesTable.estado, "em_revisao"),
          isNull(atendimentoIaComportamentoVersoesTable.revisadoEm),
          eq(
            atendimentoIaComportamentoVersoesTable.atualizadoEm,
            d.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaComportamentoVersoesTable.id });
    if (!x) throw new Error("REVISAO_DESATUALIZADA");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "revisar_comportamento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_comportamento_revisado",
      metadados: { decisao: d.decisao },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
