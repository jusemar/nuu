"use server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  administradoresTable,
  auditoriasAdministrativasTable,
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  fornecedorProdutoVinculosTable,
  productPricingTable,
  productTable,
  representantesComissionadosProdutosTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";

import { responderOperacaoProduto } from "./responder-operacao-produto";
/** Só o gestor define um destinatário explícito para PRÓXIMAS vendas, ou nenhum. */
export async function definirRepresentanteComissionadoProduto(
  entrada: unknown,
) {
  return responderOperacaoProduto(async () => {
    const ator = await exigirGestorRepresentantes();
    const dados = z
      .object({ produtoId: z.uuid(), autorizacaoId: z.uuid().nullable() })
      .strict()
      .parse(entrada);
    return dbTransacional.transaction(async (tx) => {
      const [admin] = await tx
        .select()
        .from(administradoresTable)
        .where(eq(administradoresTable.id, ator.administradorId))
        .for("update");
      if (
        !admin?.administradorPrincipal ||
        admin.status !== "ativo" ||
        admin.usuarioId !== ator.userId
      )
        throw new Error("Gestão indisponível.");
      // A mesma chave serializa ausência, alteração e captura no checkout. Não há fallback.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`comissionado-produto:${dados.produtoId}`},0))`,
      );
      const [produto] = await tx
        .select({ id: productTable.id, tipo: productTable.productKind })
        .from(productTable)
        .where(eq(productTable.id, dados.produtoId));
      if (!produto) throw new Error("Produto indisponível.");

      if (dados.autorizacaoId) {
        const [referencia] = await tx
          .select()
          .from(autorizacoesProdutosRepresentantesTable)
          .where(
            and(
              eq(
                autorizacoesProdutosRepresentantesTable.id,
                dados.autorizacaoId,
              ),
              eq(
                autorizacoesProdutosRepresentantesTable.produtoId,
                dados.produtoId,
              ),
            ),
          );
        if (!referencia)
          throw new Error("Autorização não corresponde ao produto.");
        const [r] = await tx
          .select()
          .from(representantesFornecedoresTable)
          .where(
            eq(
              representantesFornecedoresTable.id,
              referencia.representanteFornecedorId,
            ),
          );
        if (!r) throw new Error("Vínculo indisponível.");
        const [f] = await tx
          .select()
          .from(fornecedoresTable)
          .where(eq(fornecedoresTable.id, r.fornecedorId))
          .for("share");
        const [v] = await tx
          .select()
          .from(representantesFornecedoresTable)
          .where(eq(representantesFornecedoresTable.id, r.id))
          .for("share");
        const [a] = await tx
          .select()
          .from(autorizacoesProdutosRepresentantesTable)
          .where(
            eq(autorizacoesProdutosRepresentantesTable.id, dados.autorizacaoId),
          )
          .for("share");
        const precos = await tx
          .select({ tipo: productPricingTable.type })
          .from(productPricingTable)
          .where(eq(productPricingTable.productId, dados.produtoId));
        const comerciais = await tx
          .select()
          .from(fornecedorProdutoVinculosTable)
          .where(
            and(
              eq(fornecedorProdutoVinculosTable.produtoId, dados.produtoId),
              eq(fornecedorProdutoVinculosTable.fornecedorId, r.fornecedorId),
            ),
          )
          .for("share");
        if (
          produto.tipo !== "simple" ||
          precos.length !== 1 ||
          precos[0].tipo !== "dropshipping" ||
          f?.status !== "ativo" ||
          !v?.ativo ||
          v.fornecedorId !== r.fornecedorId ||
          !a?.ativa ||
          !a.comissaoAtiva ||
          a.produtoId !== dados.produtoId ||
          a.representanteFornecedorId !== v.id ||
          !a.comissaoTipo ||
          a.comissaoValor === null ||
          comerciais.length !== 1 ||
          comerciais[0].status !== "ativo"
        )
          throw new Error(
            "Representante ou comissão indisponível para este produto.",
          );
      }
      await tx
        .insert(representantesComissionadosProdutosTable)
        .values({ ...dados, atualizadoPorUsuarioId: ator.userId })
        .onConflictDoUpdate({
          target: representantesComissionadosProdutosTable.produtoId,
          set: {
            autorizacaoId: dados.autorizacaoId,
            atualizadoPorUsuarioId: ator.userId,
            updatedAt: new Date(),
          },
        });
      await tx
        .insert(auditoriasAdministrativasTable)
        .values({
          atorAdministradorId: ator.administradorId,
          acao: "representantes.comissionado_proximas_vendas",
          recursoTipo: "produto",
          recursoId: dados.produtoId,
          resultado: "sucesso",
          metadados: { autorizacaoId: dados.autorizacaoId },
        });
      return { produtoId: dados.produtoId };
    });
  });
}
