"use server";

import {
  auditoriasAdministrativasTable,
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
    return vinculo;
  });
}
