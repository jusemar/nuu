"use server";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { criarVersaoCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";
import {
  atendimentoIaCasoTesteVersoesTable,
  mapearVersaoCasoTeste,
  prepararConteudoCaso,
} from "./auxiliares";
export async function criarVersaoCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = criarVersaoCasoTesteSchema.parse(entrada);
  const p = prepararConteudoCaso(d.conteudo);
  const id = await dbTransacional.transaction(async (tx) => {
    // Garante numeração monotônica mesmo sob repetição ou concorrência de rede.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${d.casoTesteId}))`,
    );
    const [anterior] = await tx
      .select({
        id: atendimentoIaCasoTesteVersoesTable.id,
        numero: atendimentoIaCasoTesteVersoesTable.numeroVersao,
      })
      .from(atendimentoIaCasoTesteVersoesTable)
      .where(eq(atendimentoIaCasoTesteVersoesTable.casoTesteId, d.casoTesteId))
      .orderBy(desc(atendimentoIaCasoTesteVersoesTable.numeroVersao))
      .limit(1);
    if (!anterior) throw new Error("CASO_TESTE_NAO_ENCONTRADO");
    const [nova] = await tx
      .insert(atendimentoIaCasoTesteVersoesTable)
      .values({
        casoTesteId: d.casoTesteId,
        numeroVersao: anterior.numero + 1,
        versaoAnteriorId: anterior.id,
        ...mapearVersaoCasoTeste(p.normalizado, p.hash, ator.usuarioId),
      })
      .returning({ id: atendimentoIaCasoTesteVersoesTable.id });
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "criar_versao_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_teste_versao_criada",
      resultado: "sucesso_comprovado",
    });
    return nova!.id;
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { id, sucesso: true as const };
}
