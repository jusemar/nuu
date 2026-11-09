"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  auditoriasAdministrativasTable,
  autorizacoesProdutosRepresentantesTable,
  fornecedorProdutoVinculosTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { exigirGestorRepresentantes } from "../../queries/representantes/exigir-gestor-representantes";
import { salvarAutorizacaoProdutoRepresentanteSchema } from "../../schemas/representantes/gestao-representantes.schema";

/** A liberação fica vinculada a UMA pessoa em UM fornecedor; não altera o produto. */
export async function salvarAutorizacaoProdutoRepresentante(entrada: unknown) {
  const gestor = await exigirGestorRepresentantes();
  const dados = salvarAutorizacaoProdutoRepresentanteSchema.parse(entrada);
  return dbTransacional.transaction(async (transacao) => {
    // A autorização individual só pode alcançar produto comercialmente associado ao fornecedor do vínculo.
    const [vinculo] = await transacao
      .select({ fornecedorId: representantesFornecedoresTable.fornecedorId })
      .from(representantesFornecedoresTable)
      .where(
        eq(representantesFornecedoresTable.id, dados.representanteFornecedorId),
      )
      .limit(1);
    if (!vinculo) throw new Error("VINCULO_INVALIDO");
    const [produto] = await transacao
      .select({ id: fornecedorProdutoVinculosTable.id })
      .from(fornecedorProdutoVinculosTable)
      .where(
        and(
          eq(fornecedorProdutoVinculosTable.fornecedorId, vinculo.fornecedorId),
          eq(fornecedorProdutoVinculosTable.produtoId, dados.produtoId),
          eq(fornecedorProdutoVinculosTable.status, "ativo"),
        ),
      )
      .limit(1);
    if (dados.ativa && !produto) throw new Error("PRODUTO_FORNECEDOR_INVALIDO");
    const [autorizacao] = await transacao
      .insert(autorizacoesProdutosRepresentantesTable)
      .values({
        ...dados,
        criadoPorUsuarioId: gestor.userId,
        atualizadoPorUsuarioId: gestor.userId,
      })
      .onConflictDoUpdate({
        target: [
          autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
          autorizacoesProdutosRepresentantesTable.produtoId,
        ],
        set: {
          ativa: dados.ativa,
          atualizadoPorUsuarioId: gestor.userId,
          updatedAt: new Date(),
        },
      })
      .returning({ id: autorizacoesProdutosRepresentantesTable.id });
    await transacao.insert(auditoriasAdministrativasTable).values({
      atorAdministradorId: gestor.administradorId,
      acao: dados.ativa
        ? "representantes.produto_liberado"
        : "representantes.produto_revogado",
      resultado: "sucesso",
      recursoTipo: "autorizacao_produto_representante",
      recursoId: autorizacao.id,
      metadados: {
        representanteFornecedorId: dados.representanteFornecedorId,
        produtoId: dados.produtoId,
      },
    });
    revalidatePath("/admin/fornecedores/representantes");
    return autorizacao;
  });
}
