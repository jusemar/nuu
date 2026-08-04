"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaComportamentoVersoesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { calcularHashComportamento } from "../../lib/admin/comportamento/calcular-hash-comportamento";
import { montarInstrucoesCandidatas } from "../../lib/admin/comportamento/montar-instrucoes-candidatas";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarRascunhoComportamentoSchema } from "../../schemas/admin/comportamento-editor.schema";
export async function atualizarRascunhoComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = atualizarRascunhoComportamentoSchema.parse(entrada);
  const c = montarInstrucoesCandidatas(dados.configuracao);
  await dbTransacional.transaction(async (tx) => {
    const [v] = await tx
      .update(atendimentoIaComportamentoVersoesTable)
      .set({
        configuracaoEstruturada: c.configuracao,
        blocosAdministrativos: c.blocos,
        hash: calcularHashComportamento(c.configuracao),
        motivoAlteracao: dados.motivoAlteracao,
        resumoAlteracao: dados.resumoAlteracao,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(atendimentoIaComportamentoVersoesTable.id, dados.versaoId),
          eq(atendimentoIaComportamentoVersoesTable.estado, "rascunho"),
          eq(
            atendimentoIaComportamentoVersoesTable.atualizadoEm,
            dados.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaComportamentoVersoesTable.id });
    if (!v) throw new Error("RASCUNHO_DESATUALIZADO_OU_NAO_EDITAVEL");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "editar_comportamento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_comportamento_atualizado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { sucesso: true as const };
}
