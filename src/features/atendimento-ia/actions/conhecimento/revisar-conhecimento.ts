"use server";

import { and, count, eq, inArray, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaDocumentoVersoesTable,
  atendimentoIaPapeisAdminTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { compararTimestampSerializado } from "../../lib/admin/concorrencia/comparar-timestamp-serializado";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { podeAutorDecidir } from "../../lib/admin/revisao/politica-transicao-revisao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { revisarConhecimentoSchema } from "../../schemas/admin/editor-conhecimento.schema";

/** Decide a versão candidata sem publicar ou indexar o conhecimento. */
export async function revisarConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("revisoes_decisao");
  const dados = revisarConhecimentoSchema.parse(entrada);

  await dbTransacional.transaction(async (transacao) => {
    const [versao] = await transacao
      .select({ autorId: atendimentoIaDocumentoVersoesTable.criadoPorId })
      .from(atendimentoIaDocumentoVersoesTable)
      .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId))
      .limit(1);
    if (!versao) throw new Error("VERSAO_NAO_DISPONIVEL");

    const [outros] = await transacao
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
        autorId: versao.autorId ?? "",
        decisorId: ator.usuarioId,
        outrosDecisoresAtivos: outros?.total ?? 0,
      })
    ) {
      throw new Error("AUTOAPROVACAO_NAO_PERMITIDA");
    }

    const agora = new Date();
    const [revisada] = await transacao
      .update(atendimentoIaDocumentoVersoesTable)
      .set({
        atualizadoEm: agora,
        estado: dados.decisao === "aprovada" ? "em_revisao" : "rascunho",
        motivoBloqueio:
          dados.decisao === "reprovada" ? dados.motivo : null,
        motivoReprovacao:
          dados.decisao === "reprovada" ? dados.motivo : null,
        publicacaoBloqueada: dados.decisao === "reprovada",
        reprovadoEm: dados.decisao === "reprovada" ? agora : null,
        reprovadoPorId:
          dados.decisao === "reprovada" ? ator.usuarioId : null,
        responsavelRevisaoId: ator.usuarioId,
        revisadoEm: agora,
      })
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId),
          eq(atendimentoIaDocumentoVersoesTable.estado, "em_revisao"),
          isNull(atendimentoIaDocumentoVersoesTable.revisadoEm),
          compararTimestampSerializado(
            atendimentoIaDocumentoVersoesTable.atualizadoEm,
            dados.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaDocumentoVersoesTable.id });
    if (!revisada) throw new Error("REVISAO_DESATUALIZADA");

    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "revisar_conhecimento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conhecimento_revisado",
      metadados: { decisao: dados.decisao, versaoId: revisada.id },
      resultado: "sucesso_comprovado",
    });
  });

  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { sucesso: true as const };
}
