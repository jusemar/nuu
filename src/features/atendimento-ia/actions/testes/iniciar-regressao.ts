"use server";
import { revalidatePath } from "next/cache";

import { decidirModoExecucao } from "../../lib/admin/laboratorio/politica-modo-execucao";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { executarLaboratorioSchema } from "../../schemas/admin/laboratorio.schema";
import {
  prepararExecucaoLaboratorio,
  processarExecucao,
  resolverCasos,
} from "./executor-laboratorio-interno";
export async function iniciarRegressao(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("testes_execucao");
  const d = executarLaboratorioSchema.parse(entrada);
  const casos = await resolverCasos(d);
  const modo = decidirModoExecucao({
    quantidadeCasos: casos.length,
    tipoComparacao: d.tipoComparacao,
  });
  const preparado = await prepararExecucaoLaboratorio(
    d,
    ator.usuarioId,
    modo,
    casos,
  );
  if (modo === "sincrono")
    await processarExecucao(preparado.execucaoId, casos, preparado);
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return {
    id: preparado.execucaoId,
    modo,
    status:
      modo === "sincrono" ? ("concluida" as const) : ("pendente" as const),
  };
}
