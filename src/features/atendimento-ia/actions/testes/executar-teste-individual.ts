"use server";
import { revalidatePath } from "next/cache";

import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { executarLaboratorioSchema } from "../../schemas/admin/laboratorio.schema";
import {
  prepararExecucaoLaboratorio,
  processarExecucao,
  resolverCasos,
} from "./executor-laboratorio-interno";
export async function executarTesteIndividual(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("testes_execucao");
  const d = executarLaboratorioSchema.parse(entrada);
  if (!d.casoTesteVersaoId) throw new Error("TESTE_INDIVIDUAL_EXIGE_CASO");
  const casos = await resolverCasos(d);
  const preparado = await prepararExecucaoLaboratorio(
    d,
    ator.usuarioId,
    "sincrono",
    casos,
  );
  await processarExecucao(preparado.execucaoId, casos, preparado);
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { id: preparado.execucaoId, status: "concluida" as const };
}
