"use server";
import { randomUUID } from "node:crypto";

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
import { criarComportamentoSchema } from "../../schemas/admin/comportamento-editor.schema";
export async function criarComportamento(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const dados = criarComportamentoSchema.parse(entrada);
  const candidato = montarInstrucoesCandidatas(dados.configuracao);
  const id = await dbTransacional.transaction(async (tx) => {
    const [c] = await tx
      .insert(atendimentoIaComportamentosTable)
      .values({
        chaveEstavel: `comportamento-${randomUUID()}`,
        nome: dados.nome,
        descricao: dados.descricao,
        criadoPorId: ator.usuarioId,
      })
      .returning({ id: atendimentoIaComportamentosTable.id });
    if (!c) throw new Error("FALHA_CRIAR_COMPORTAMENTO");
    await tx
      .insert(atendimentoIaComportamentoVersoesTable)
      .values({
        comportamentoId: c.id,
        numeroVersao: 1,
        configuracaoEstruturada: candidato.configuracao,
        blocosAdministrativos: candidato.blocos,
        hash: calcularHashComportamento(candidato.configuracao),
        motivoAlteracao: dados.motivoAlteracao,
        resumoAlteracao: dados.resumoAlteracao,
        criadoPorId: ator.usuarioId,
      });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_comportamento",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_comportamento_criado",
      resultado: "sucesso_comprovado",
    });
    return c.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/conhecimentos");
  return { id, sucesso: true as const };
}
