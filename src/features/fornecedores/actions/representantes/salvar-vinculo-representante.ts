"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  administradoresFuncoesTable,
  administradoresTable,
  auditoriasAdministrativasTable,
  fornecedoresTable,
  funcoesAdministrativasTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { exigirGestorRepresentantes } from "../../queries/representantes/exigir-gestor-representantes";
import { salvarVinculoRepresentanteSchema } from "../../schemas/representantes/gestao-representantes.schema";

/** Vincula/revoga sem criar identidade, função ou permissão administrativa. */
export async function salvarVinculoRepresentante(entrada: unknown) {
  const gestor = await exigirGestorRepresentantes();
  const dados = salvarVinculoRepresentanteSchema.parse(entrada);
  return dbTransacional.transaction(async (transacao) => {
    // Somente uma identidade administrativa ativa com a função específica pode receber o vínculo.
    const [elegivel] = await transacao
      .select({ id: administradoresTable.id })
      .from(administradoresTable)
      .innerJoin(
        administradoresFuncoesTable,
        eq(
          administradoresFuncoesTable.administradorId,
          administradoresTable.id,
        ),
      )
      .innerJoin(
        funcoesAdministrativasTable,
        eq(
          funcoesAdministrativasTable.id,
          administradoresFuncoesTable.funcaoId,
        ),
      )
      .where(
        and(
          eq(administradoresTable.usuarioId, dados.usuarioId),
          eq(administradoresTable.status, "ativo"),
          eq(funcoesAdministrativasTable.chave, "representante_fornecedor"),
          eq(funcoesAdministrativasTable.status, "ativa"),
        ),
      )
      .limit(1);
    const [fornecedor] = await transacao
      .select({ id: fornecedoresTable.id })
      .from(fornecedoresTable)
      .where(eq(fornecedoresTable.id, dados.fornecedorId))
      .limit(1);
    if ((dados.ativo && !elegivel) || !fornecedor)
      throw new Error("REPRESENTANTE_OU_FORNECEDOR_INVALIDO");
    const [vinculo] = await transacao
      .insert(representantesFornecedoresTable)
      .values({
        ...dados,
        criadoPorUsuarioId: gestor.userId,
        atualizadoPorUsuarioId: gestor.userId,
      })
      .onConflictDoUpdate({
        target: [
          representantesFornecedoresTable.usuarioId,
          representantesFornecedoresTable.fornecedorId,
        ],
        set: {
          ativo: dados.ativo,
          atualizadoPorUsuarioId: gestor.userId,
          updatedAt: new Date(),
        },
      })
      .returning({ id: representantesFornecedoresTable.id });
    await transacao.insert(auditoriasAdministrativasTable).values({
      atorAdministradorId: gestor.administradorId,
      acao: dados.ativo
        ? "representantes.vinculo_ativado"
        : "representantes.vinculo_revogado",
      resultado: "sucesso",
      recursoTipo: "representante_fornecedor",
      recursoId: vinculo.id,
      metadados: {
        fornecedorId: dados.fornecedorId,
        usuarioId: dados.usuarioId,
      },
    });
    revalidatePath("/admin/fornecedores/representantes");
    return vinculo;
  });
}
