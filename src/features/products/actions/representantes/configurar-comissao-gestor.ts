"use server";
import { and, eq } from "drizzle-orm";

import {
  administradoresTable,
  autorizacoesProdutosRepresentantesTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";

import { buscarComissoesProdutoGestor } from "../../queries/representantes/buscar-comissoes-produto-gestor";
import { configurarComissaoRepresentanteSchema } from "../../schemas/comissoes-representantes/comissao-representante.schema";
import { auditarEscritaProduto } from "./persistir-produto-representante";
import { responderOperacaoProduto } from "./responder-operacao-produto";

export async function consultarComissoesProdutoGestor(produtoId: unknown) {
  return buscarComissoesProdutoGestor(produtoId);
}
export async function configurarComissaoProdutoGestor(entrada: unknown) {
  return responderOperacaoProduto(async () => {
    const ator = await exigirGestorRepresentantes();
    const dados = configurarComissaoRepresentanteSchema.parse(entrada);
    return dbTransacional.transaction(async (tx) => {
      // Serializa também com desativação/rebaixamento do gestor.
      const [gestorAtual] = await tx
        .select()
        .from(administradoresTable)
        .where(eq(administradoresTable.id, ator.administradorId))
        .for("update");
      if (
        !gestorAtual ||
        gestorAtual.usuarioId !== ator.userId ||
        gestorAtual.status !== "ativo" ||
        !gestorAtual.administradorPrincipal
      )
        throw new Error("Gestão de comissão indisponível.");
      const [autorizacao] = await tx
        .select()
        .from(autorizacoesProdutosRepresentantesTable)
        .where(
          and(
            eq(autorizacoesProdutosRepresentantesTable.id, dados.autorizacaoId),
            eq(
              autorizacoesProdutosRepresentantesTable.produtoId,
              dados.produtoId,
            ),
          ),
        )
        .for("update");
      if (!autorizacao) throw new Error("Autorização não encontrada.");
      await tx
        .update(autorizacoesProdutosRepresentantesTable)
        .set({
          comissaoTipo: dados.tipo,
          comissaoValor: dados.valor,
          comissaoVisivel: dados.visivel,
          comissaoAtiva: dados.ativa,
          atualizadoPorUsuarioId: ator.userId,
          updatedAt: new Date(),
        })
        .where(eq(autorizacoesProdutosRepresentantesTable.id, autorizacao.id));
      const [vinculo] = await tx
        .select({ fornecedorId: representantesFornecedoresTable.fornecedorId })
        .from(representantesFornecedoresTable)
        .where(
          eq(
            representantesFornecedoresTable.id,
            autorizacao.representanteFornecedorId,
          ),
        );
      await auditarEscritaProduto(
        tx,
        ator,
        dados.produtoId,
        vinculo.fornecedorId,
        "comissao_configurada",
      );
      return { id: autorizacao.id };
    });
  });
}
