"use server";
import { eq, sql } from "drizzle-orm";

import {
  administradoresTable,
  auditoriasAdministrativasTable,
  identidadesJaaaRepresentantesTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { exigirGestorRepresentantes } from "../../queries/representantes/exigir-gestor-representantes";
import { salvarIdentidadeJaaaSchema } from "../../schemas/jaaa/gestao-jaaa.schema";
/** Apenas gestor; a revisão da conta pública ocorre fora da Nooo, sem credenciais. */
export async function salvarIdentidadeJaaa(entrada: unknown) {
  try {
    const ator = await exigirGestorRepresentantes(),
      d = salvarIdentidadeJaaaSchema.parse(entrada);
    await dbTransacional.transaction(async (tx) => {
      const [admin] = await tx
        .select()
        .from(administradoresTable)
        .where(eq(administradoresTable.id, ator.administradorId))
        .for("share");
      if (
        admin?.status !== "ativo" ||
        !admin.administradorPrincipal ||
        admin.usuarioId !== ator.userId
      )
        throw new Error("Gestão indisponível.");
      const vinculos = await tx
        .select()
        .from(representantesFornecedoresTable)
        .where(eq(representantesFornecedoresTable.usuarioId, d.usuarioId))
        .for("share");
      if (!vinculos.length) throw new Error("Representante indisponível.");
      if (d.ativa) {
        const ativos = await tx.execute<{ id: string }>(
          sql`select r.id from representantes_fornecedores r join fornecedores f on f.id=r.fornecedor_id join administradores a on a.usuario_id=r.usuario_id where r.usuario_id=${d.usuarioId} and r.ativo and f.status='ativo' and a.status='ativo' for share of r,f,a`,
        );
        if (!ativos.rows.length) throw new Error("Representante indisponível.");
      }
      await tx
        .insert(identidadesJaaaRepresentantesTable)
        .values({ ...d, atualizadoPorUsuarioId: ator.userId })
        .onConflictDoUpdate({
          target: identidadesJaaaRepresentantesTable.usuarioId,
          set: {
            identidade: d.identidade,
            ativa: d.ativa,
            atualizadoPorUsuarioId: ator.userId,
            updatedAt: new Date(),
          },
        });
      await tx.insert(auditoriasAdministrativasTable).values({
        atorAdministradorId: ator.administradorId,
        acao: "representantes.identidade_jaaa_atualizada",
        recursoTipo: "usuario_representante",
        recursoId: d.usuarioId,
        resultado: "sucesso",
        metadados: { ativa: d.ativa, identidade: d.identidade },
      });
    });
    return { sucesso: true as const };
  } catch {
    return {
      sucesso: false as const,
      mensagem:
        "Não foi possível salvar o Jaaa. Confira o usuário público e a disponibilidade do representante.",
    };
  }
}
