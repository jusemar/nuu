"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { atendimentoIaExecucoesLaboratorioTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { montarSnapshotCandidato } from "../../lib/admin/laboratorio/montar-snapshot-candidato";
import { montarSnapshotPublicado } from "../../lib/admin/laboratorio/montar-snapshot-publicado";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { retomarRegressaoSchema } from "../../schemas/admin/laboratorio.schema";
import { processarExecucao } from "./executor-laboratorio-interno";
export async function retomarRegressao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("testes_execucao");
  const d = retomarRegressaoSchema.parse(entrada);
  const filtroDono =
    ator.papel === "gestor_principal"
      ? eq(atendimentoIaExecucoesLaboratorioTable.id, d.execucaoId)
      : and(
          eq(atendimentoIaExecucoesLaboratorioTable.id, d.execucaoId),
          eq(
            atendimentoIaExecucoesLaboratorioTable.solicitadoPorId,
            ator.usuarioId,
          ),
        );
  const [execucao] = await dbTransacional
    .update(atendimentoIaExecucoesLaboratorioTable)
    .set({
      status: "processando",
      iniciadoEm: new Date(),
      atualizadoEm: new Date(),
    })
    .where(
      and(
        filtroDono,
        inArray(atendimentoIaExecucoesLaboratorioTable.status, [
          "pendente",
          "falhou",
        ]),
      ),
    )
    .returning();
  if (!execucao) throw new Error("EXECUCAO_NAO_RETOMAVEL");
  const config = execucao.configuracaoCongelada as {
    casosIds: string[];
    snapshotPublicado: ReturnType<typeof montarSnapshotPublicado>;
    snapshotCandidato: ReturnType<typeof montarSnapshotCandidato>;
  };
  const publicado = config.snapshotPublicado;
  const candidato = config.snapshotCandidato;
  await processarExecucao(execucao.id, config.casosIds, {
    snapshotPublicado: publicado,
    snapshotCandidato: candidato,
  });
  await dbTransacional.transaction(async (tx) =>
    registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "retomar_regressao",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_laboratorio_retomado",
      metadados: { chaveIdempotenciaRetomada: d.chaveIdempotencia },
      resultado: "sucesso_comprovado",
    }),
  );
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
