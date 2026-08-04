"use server";
import { revalidatePath } from "next/cache";

import { atendimentoIaConjuntosTesteTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarConjuntoTesteSchema } from "../../schemas/admin/caso-teste.schema";
import { chaveConjunto } from "./auxiliares";
export async function criarConjuntoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = criarConjuntoTesteSchema.parse(entrada);
  const id = await dbTransacional.transaction(async (tx) => {
    const [c] = await tx
      .insert(atendimentoIaConjuntosTesteTable)
      .values({
        chaveEstavel: chaveConjunto(),
        ...d,
        criadoPorId: ator.usuarioId,
      })
      .returning({ id: atendimentoIaConjuntosTesteTable.id });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_conjunto_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_conjunto_teste_criado",
      resultado: "sucesso_comprovado",
    });
    return c!.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { id, sucesso: true as const };
}
