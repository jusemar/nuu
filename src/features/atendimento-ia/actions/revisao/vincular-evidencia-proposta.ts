"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaAvaliacoesTable,
  atendimentoIaConversasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaMensagensTable,
  atendimentoIaOcorrenciasTable,
  atendimentoIaPropostaEvidenciasTable,
  atendimentoIaPropostasMelhoriaTable,
  atendimentoIaResultadosRagTable,
  atendimentoIaTransferenciasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { prepararEvidenciaSanitizada } from "../../lib/admin/revisao/preparar-evidencia-sanitizada";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { vincularEvidenciaPropostaSchema } from "../../schemas/admin/revisao-operacoes.schema";

export async function vincularEvidenciaProposta(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("propostas_escrita");
  const dados = vincularEvidenciaPropostaSchema.parse(entrada);
  await dbTransacional.transaction(async (transacao) => {
    const [proposta] = await transacao
      .select({ id: atendimentoIaPropostasMelhoriaTable.id })
      .from(atendimentoIaPropostasMelhoriaTable)
      .where(eq(atendimentoIaPropostasMelhoriaTable.id, dados.propostaId))
      .limit(1);
    if (
      !proposta ||
      !(await referenciaExiste(transacao, dados.tipo, dados.referenciaId))
    )
      throw new Error("EVIDENCIA_NAO_DISPONIVEL");
    await transacao.insert(atendimentoIaPropostaEvidenciasTable).values({
      criadoPorId: ator.usuarioId,
      dataEvidencia: dados.data,
      descricaoSanitizada: prepararEvidenciaSanitizada(dados.descricao),
      propostaId: proposta.id,
      referenciaId: dados.referenciaId,
      tipo: dados.tipo,
    });
    await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
      acao: "vincular_evidencia_proposta",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_evidencia_proposta_vinculada",
      metadados: { propostaId: proposta.id, tipo: dados.tipo },
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/revisoes");
  return { sucesso: true as const };
}

type Transacao = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];
async function referenciaExiste(transacao: Transacao, tipo: zTipo, id: string) {
  switch (tipo) {
    case "conversa":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaConversasTable.id })
            .from(atendimentoIaConversasTable)
            .where(eq(atendimentoIaConversasTable.id, id))
            .limit(1)
        )[0],
      );
    case "mensagem":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaMensagensTable.id })
            .from(atendimentoIaMensagensTable)
            .where(eq(atendimentoIaMensagensTable.id, id))
            .limit(1)
        )[0],
      );
    case "execucao":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaExecucoesTable.id })
            .from(atendimentoIaExecucoesTable)
            .where(eq(atendimentoIaExecucoesTable.id, id))
            .limit(1)
        )[0],
      );
    case "avaliacao":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaAvaliacoesTable.id })
            .from(atendimentoIaAvaliacoesTable)
            .where(eq(atendimentoIaAvaliacoesTable.id, id))
            .limit(1)
        )[0],
      );
    case "ocorrencia":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaOcorrenciasTable.id })
            .from(atendimentoIaOcorrenciasTable)
            .where(eq(atendimentoIaOcorrenciasTable.id, id))
            .limit(1)
        )[0],
      );
    case "transferencia":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaTransferenciasTable.id })
            .from(atendimentoIaTransferenciasTable)
            .where(eq(atendimentoIaTransferenciasTable.id, id))
            .limit(1)
        )[0],
      );
    case "resultado_rag":
      return Boolean(
        (
          await transacao
            .select({ id: atendimentoIaResultadosRagTable.id })
            .from(atendimentoIaResultadosRagTable)
            .where(eq(atendimentoIaResultadosRagTable.id, id))
            .limit(1)
        )[0],
      );
  }
}
type zTipo =
  | "conversa"
  | "mensagem"
  | "execucao"
  | "avaliacao"
  | "ocorrencia"
  | "transferencia"
  | "resultado_rag";
