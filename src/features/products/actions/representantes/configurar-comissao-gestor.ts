"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  autorizacoesProdutosRepresentantesTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";

import { buscarComissoesProdutoGestor } from "../../queries/representantes/buscar-comissoes-produto-gestor";
import { auditarEscritaProduto } from "./persistir-produto-representante";
import { responderOperacaoProduto } from "./responder-operacao-produto";

export async function consultarComissoesProdutoGestor(produtoId: unknown) {
  return buscarComissoesProdutoGestor(produtoId);
}
export async function configurarComissaoProdutoGestor(entrada: unknown) {
  return responderOperacaoProduto(async () => {
    const ator = await exigirGestorRepresentantes();
    const dados = z
      .object({
        autorizacaoId: z.uuid(),
        produtoId: z.uuid(),
        tipo: z.enum(["percentual", "fixa"]).nullable(),
        valor: z.number().int().min(0).max(2147483647).nullable(),
        visivel: z.boolean(),
      })
      .strict()
      .refine((d) =>
        d.tipo === null
          ? d.valor === null && !d.visivel
          : d.valor !== null && (d.tipo !== "percentual" || d.valor <= 10000),
      )
      .parse(entrada);
    return dbTransacional.transaction(async (tx) => {
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
