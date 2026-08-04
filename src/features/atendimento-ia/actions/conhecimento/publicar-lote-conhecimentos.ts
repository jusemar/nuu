"use server";

import { revalidatePath } from "next/cache";

import { publicarLoteAtomicamente } from "../../lib/admin/publicacao/publicar-lote-atomicamente";
import { validarPublicacaoNoServidor } from "../../lib/admin/publicacao/validar-publicacao-no-servidor";
import { ClienteEmbeddingsOpenAiOficial } from "../../lib/rag/cliente-embeddings-openai";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { buscarEvidenciasElegibilidadeAdmin } from "../../queries/admin/publicacao/buscar-evidencias-elegibilidade";
import { publicarLoteConhecimentosSchema } from "../../schemas/admin/publicacao.schema";
import { configuracaoRagSchema } from "../../schemas/configuracao-rag.schema";

export async function publicarLoteConhecimentos(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("publicacoes_escrita");
  if (ator.papel !== "gestor_principal")
    throw new Error("SOMENTE_GESTOR_PUBLICA");
  const dados = publicarLoteConhecimentosSchema.parse(entrada);
  const evidencias = await buscarEvidenciasElegibilidadeAdmin({
    candidatoId: dados.execucaoLaboratorioId,
    tipo: "lote",
  });
  const elegibilidade = validarPublicacaoNoServidor(
    evidencias,
    dados.justificativaAlertas,
  );
  if (!evidencias.itensLote?.length) throw new Error("LOTE_SEM_INTEGRANTES");
  if (!process.env.OPENAI_API_KEY)
    throw new Error("CONFIGURACAO_PUBLICACAO_INDISPONIVEL");
  const revalidarElegibilidade = async () =>
    validarPublicacaoNoServidor(
      await buscarEvidenciasElegibilidadeAdmin({
        candidatoId: dados.execucaoLaboratorioId,
        tipo: "lote",
      }),
      dados.justificativaAlertas,
    );
  const resultado = await publicarLoteAtomicamente({
    atorId: ator.usuarioId,
    chaveIdempotencia: dados.chaveIdempotencia,
    identidade: elegibilidade.identidadeCandidato,
    justificativaAlertas: dados.justificativaAlertas,
    itens: evidencias.itensLote,
    configuracao: configuracaoRagSchema.parse(process.env),
    clienteEmbeddings: new ClienteEmbeddingsOpenAiOficial(
      process.env.OPENAI_API_KEY,
    ),
    revalidarElegibilidade,
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return {
    sucesso: true as const,
    idempotente: resultado.idempotente,
    identidadePublicacao: resultado.publicacao.identidade,
  };
}
