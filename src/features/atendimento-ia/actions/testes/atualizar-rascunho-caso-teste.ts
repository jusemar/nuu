"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "../../lib/admin/permissoes/auditoria-permissoes";
import { exigirCapacidadeAtendimentoIa } from "../../queries/admin/permissoes/buscar-acesso-atendimento-ia";
import { atualizarRascunhoCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";
import {
  atendimentoIaCasoTesteVersoesTable,
  mapearVersaoCasoTeste,
  prepararConteudoCaso,
} from "./auxiliares";
export async function atualizarRascunhoCasoTeste(entrada: unknown) {
  const ator = await exigirCapacidadeAtendimentoIa("rascunhos_escrita");
  const d = atualizarRascunhoCasoTesteSchema.parse(entrada);
  const p = prepararConteudoCaso(d.conteudo);
  await dbTransacional.transaction(async (tx) => {
    const [v] = await tx
      .update(atendimentoIaCasoTesteVersoesTable)
      .set({
        ...mapearVersaoCasoTeste(p.normalizado, p.hash, ator.usuarioId),
        revisadoPorId: null,
        revisadoEm: null,
        motivoReprovacao: null,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(atendimentoIaCasoTesteVersoesTable.id, d.versaoId),
          eq(atendimentoIaCasoTesteVersoesTable.estado, "rascunho"),
          eq(
            atendimentoIaCasoTesteVersoesTable.atualizadoEm,
            d.atualizadoEmEsperado,
          ),
        ),
      )
      .returning({ id: atendimentoIaCasoTesteVersoesTable.id });
    if (!v) throw new Error("RASCUNHO_DESATUALIZADO_OU_IMUTAVEL");
    await registrarAuditoriaPermissaoAtendimentoIa(tx, {
      acao: "atualizar_rascunho_caso_teste",
      atorId: ator.usuarioId,
      evento: "atendimento_ia_caso_teste_rascunho_atualizado",
      resultado: "sucesso_comprovado",
    });
  });
  revalidatePath("/admin/atendente-ia/treinamento/testes");
  return { sucesso: true as const };
}
