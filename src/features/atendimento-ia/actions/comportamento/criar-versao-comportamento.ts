"use server";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  atendimentoIaComportamentosTable,
  atendimentoIaComportamentoVersoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { calcularHashComportamento } from "../../lib/admin/comportamento/calcular-hash-comportamento";
import { montarInstrucoesCandidatas } from "../../lib/admin/comportamento/montar-instrucoes-candidatas";
import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarVersaoComportamentoSchema } from "../../schemas/admin/comportamento-editor.schema";
export async function criarVersaoComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = criarVersaoComportamentoSchema.parse(entrada);
  const candidato = montarInstrucoesCandidatas(dados.configuracao);
  const id = await dbTransacional.transaction(async (tx) => {
    const [c] = await tx
      .select({ id: atendimentoIaComportamentosTable.id })
      .from(atendimentoIaComportamentosTable)
      .where(eq(atendimentoIaComportamentosTable.id, dados.comportamentoId))
      .limit(1);
    if (!c) throw new Error("COMPORTAMENTO_NAO_ENCONTRADO");
    // Evita que duas requisições reservem o mesmo número de versão.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${c.id}))`);
    const [u] = await tx
      .select({ n: atendimentoIaComportamentoVersoesTable.numeroVersao })
      .from(atendimentoIaComportamentoVersoesTable)
      .where(eq(atendimentoIaComportamentoVersoesTable.comportamentoId, c.id))
      .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao))
      .limit(1);
    const [v] = await tx
      .insert(atendimentoIaComportamentoVersoesTable)
      .values({
        comportamentoId: c.id,
        numeroVersao: (u?.n ?? 0) + 1,
        configuracaoEstruturada: candidato.configuracao,
        blocosAdministrativos: candidato.blocos,
        hash: calcularHashComportamento(candidato.configuracao),
        motivoAlteracao: dados.motivoAlteracao,
        resumoAlteracao: dados.resumoAlteracao,
        criadoPorId: ator.usuarioId,
      })
      .returning({ id: atendimentoIaComportamentoVersoesTable.id });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_versao_comportamento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_comportamento_versao_criada",
      resultado: "sucesso_comprovado",
    });
    return v!.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { id, sucesso: true as const };
}
