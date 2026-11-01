"use server";
import { eq, sql } from "drizzle-orm";

import {
  administradoresTable,
  atendimentosJaaaProdutosTable,
  auditoriasAdministrativasTable,
  productTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  type AtendimentoElegivelJaaa,
  consultaElegiveisJaaa,
} from "../../queries/jaaa/elegibilidade-atendimento";
import { exigirGestorRepresentantes } from "../../queries/representantes/exigir-gestor-representantes";
import { salvarAtendimentoJaaaSchema } from "../../schemas/jaaa/gestao-jaaa.schema";
/** Destinatário explícito por produto; nunca modifica a seleção de comissão ou os snapshots. */
export async function salvarAtendimentoJaaa(entrada: unknown) {
  try {
    const ator = await exigirGestorRepresentantes(),
      d = salvarAtendimentoJaaaSchema.parse(entrada);
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
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`atendimento-jaaa:${d.produtoId}`},0))`,
      );
      const [p] = await tx
        .select({ id: productTable.id })
        .from(productTable)
        .where(eq(productTable.id, d.produtoId))
        .for("share");
      if (!p) throw new Error("Produto indisponível.");
      if (d.autorizacaoId) {
        const opcoes = await tx.execute<AtendimentoElegivelJaaa>(
          consultaElegiveisJaaa({
            produtoId: d.produtoId,
            autorizacaoId: d.autorizacaoId,
            bloquear: true,
          }),
        );
        if (opcoes.rows.length !== 1)
          throw new Error("Atendimento indisponível.");
      }
      await tx
        .insert(atendimentosJaaaProdutosTable)
        .values({ ...d, atualizadoPorUsuarioId: ator.userId })
        .onConflictDoUpdate({
          target: atendimentosJaaaProdutosTable.produtoId,
          set: {
            autorizacaoId: d.autorizacaoId,
            atualizadoPorUsuarioId: ator.userId,
            updatedAt: new Date(),
          },
        });
      await tx.insert(auditoriasAdministrativasTable).values({
        atorAdministradorId: ator.administradorId,
        acao: "representantes.atendimento_jaaa_produto_atualizado",
        recursoTipo: "produto",
        recursoId: d.produtoId,
        resultado: "sucesso",
        metadados: { autorizacaoId: d.autorizacaoId },
      });
    });
    return { sucesso: true as const };
  } catch {
    return {
      sucesso: false as const,
      mensagem:
        "Não foi possível salvar. Confira se produto, representante, fornecedor e Jaaa permanecem disponíveis.",
    };
  }
}
