"use server";

import {
  auditoriasAdministrativasTable,
  autorizacoesProdutosRepresentantesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { exigirGestorRepresentantes } from "../../queries/representantes/exigir-gestor-representantes";
import { salvarAutorizacaoProdutoRepresentanteSchema } from "../../schemas/representantes/gestao-representantes.schema";

/** A liberação fica vinculada a UMA pessoa em UM fornecedor; não altera o produto. */
export async function salvarAutorizacaoProdutoRepresentante(entrada: unknown) {
  const gestor = await exigirGestorRepresentantes();
  const dados = salvarAutorizacaoProdutoRepresentanteSchema.parse(entrada);
  return dbTransacional.transaction(async (transacao) => {
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
    return autorizacao;
  });
}
