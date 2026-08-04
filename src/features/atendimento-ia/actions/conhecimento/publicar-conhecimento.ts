"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  atendimentoIaDocumentosInstitucionaisTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";

import { publicarConhecimentoAtomicamente } from "../../lib/admin/publicacao/publicar-conhecimento-atomicamente";
import { validarPublicacaoNoServidor } from "../../lib/admin/publicacao/validar-publicacao-no-servidor";
import { ClienteEmbeddingsOpenAiOficial } from "../../lib/rag/cliente-embeddings-openai";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { buscarEvidenciasElegibilidadeAdmin } from "../../queries/admin/publicacao/buscar-evidencias-elegibilidade";
import { publicarConhecimentoSchema } from "../../schemas/admin/publicacao.schema";
import { configuracaoRagSchema } from "../../schemas/configuracao-rag.schema";

export async function publicarConhecimento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("publicacoes_escrita");
  if (ator.papel !== "gestor_principal")
    throw new Error("SOMENTE_GESTOR_PUBLICA");
  const dados = publicarConhecimentoSchema.parse(entrada);
  const [registro] = await db
    .select({
      tipo: atendimentoIaDocumentosInstitucionaisTable.tipoConhecimento,
    })
    .from(atendimentoIaDocumentoVersoesTable)
    .innerJoin(
      atendimentoIaDocumentosInstitucionaisTable,
      eq(
        atendimentoIaDocumentosInstitucionaisTable.id,
        atendimentoIaDocumentoVersoesTable.documentoId,
      ),
    )
    .where(eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId))
    .limit(1);
  if (!registro) throw new Error("CANDIDATO_NAO_ENCONTRADO");
  const tipo =
    registro.tipo === "pergunta_resposta"
      ? ("pergunta_resposta" as const)
      : ("conhecimento" as const);
  const evidencias = await buscarEvidenciasElegibilidadeAdmin({
    candidatoId: dados.versaoId,
    tipo,
    conjuntoTesteId: dados.conjuntoTesteId,
  });
  const elegibilidade = validarPublicacaoNoServidor(
    evidencias,
    dados.justificativaAlertas,
  );
  const configuracao = configuracaoRagSchema.parse(process.env);
  if (!process.env.OPENAI_API_KEY)
    throw new Error("CONFIGURACAO_PUBLICACAO_INDISPONIVEL");
  const revalidarElegibilidade = async () =>
    validarPublicacaoNoServidor(
      await buscarEvidenciasElegibilidadeAdmin({
        candidatoId: dados.versaoId,
        tipo,
        conjuntoTesteId: dados.conjuntoTesteId,
      }),
      dados.justificativaAlertas,
    );
  const resultado = await publicarConhecimentoAtomicamente({
    ...dados,
    atorId: ator.usuarioId,
    identidade: elegibilidade.identidadeCandidato,
    configuracao,
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
