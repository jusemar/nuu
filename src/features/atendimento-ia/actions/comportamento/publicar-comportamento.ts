"use server";

import { revalidatePath } from "next/cache";

import { publicarComportamentoAtomicamente } from "../../lib/admin/publicacao/publicar-comportamento-atomicamente";
import { validarPublicacaoNoServidor } from "../../lib/admin/publicacao/validar-publicacao-no-servidor";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { buscarEvidenciasElegibilidadeAdmin } from "../../queries/admin/publicacao/buscar-evidencias-elegibilidade";
import { publicarComportamentoSchema } from "../../schemas/admin/publicacao.schema";

export async function publicarComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("publicacoes_escrita");
  if (ator.papel !== "gestor_principal")
    throw new Error("SOMENTE_GESTOR_PUBLICA");
  const dados = publicarComportamentoSchema.parse(entrada);
  const evidencias = await buscarEvidenciasElegibilidadeAdmin({
    candidatoId: dados.versaoId,
    tipo: "comportamento",
    conjuntoTesteId: dados.conjuntoTesteId,
  });
  const elegibilidade = validarPublicacaoNoServidor(
    evidencias,
    dados.justificativaAlertas,
  );
  const revalidarElegibilidade = async () =>
    validarPublicacaoNoServidor(
      await buscarEvidenciasElegibilidadeAdmin({
        candidatoId: dados.versaoId,
        tipo: "comportamento",
        conjuntoTesteId: dados.conjuntoTesteId,
      }),
      dados.justificativaAlertas,
    );
  const resultado = await publicarComportamentoAtomicamente({
    ...dados,
    atorId: ator.usuarioId,
    identidade: elegibilidade.identidadeCandidato,
    revalidarElegibilidade,
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return {
    sucesso: true as const,
    idempotente: resultado.idempotente,
    identidadePublicacao: resultado.publicacao.identidade,
  };
}
