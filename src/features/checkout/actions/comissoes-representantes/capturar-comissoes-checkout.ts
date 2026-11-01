import "server-only";

import { and, eq, sql } from "drizzle-orm";

import {
  autorizacoesProdutosRepresentantesTable,
  checkoutItemComissoesTable,
  checkoutPedidoItensTable,
  checkoutPedidosTable,
  fornecedoresTable,
  fornecedorProdutoVinculosTable,
  productPricingTable,
  productTable,
  representantesComissionadosProdutosTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { criarSnapshotComissaoRepresentante } from "@/features/products/lib/comissoes-representantes/criar-snapshot-comissao-representante";

import { baseComissionavelItem } from "../../lib/comissoes-representantes/base-comissionavel-item";
import type { TransacaoComissoesPedido } from "./processar-comissoes-pedido";
/** Somente o checkout chama esta captura, na transação de criação. O navegador não fornece destinatário. */
export async function capturarComissoesNoCheckoutSeguro(
  tx: TransacaoComissoesPedido,
  pedidoId: string,
  itens: ReadonlyArray<typeof checkoutPedidoItensTable.$inferSelect>,
) {
  try {
    await tx.transaction(async (sp) => {
      // Ordem estável também para carrinhos com vários produtos.
      for (const produtoId of [
        ...new Set(
          itens
            .filter((i) => i.modalidade === "dropshipping")
            .map((i) => i.produtoId),
        ),
      ].sort())
        await sp.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`comissionado-produto:${produtoId}`},0))`,
        );
      for (const item of itens) {
        if (item.modalidade !== "dropshipping") continue;
        await sp
          .transaction(async (tx) => {
            const [escolha] = await tx
              .select()
              .from(representantesComissionadosProdutosTable)
              .where(
                eq(
                  representantesComissionadosProdutosTable.produtoId,
                  item.produtoId,
                ),
              );
            if (!escolha?.autorizacaoId) return;
            const existente = await tx
              .select({ id: checkoutItemComissoesTable.id })
              .from(checkoutItemComissoesTable)
              .where(eq(checkoutItemComissoesTable.pedidoItemId, item.id));
            if (existente.length) return;
            const [pedido] = await tx
              .select({
                modalidade: checkoutPedidosTable.modalidadePedido,
                status: checkoutPedidosTable.pagamentoStatus,
              })
              .from(checkoutPedidosTable)
              .where(eq(checkoutPedidosTable.id, pedidoId));
            if (pedido?.modalidade !== "compra" || pedido.status !== "pending")
              return;
            const [referencia] = await tx
              .select()
              .from(autorizacoesProdutosRepresentantesTable)
              .where(
                and(
                  eq(
                    autorizacoesProdutosRepresentantesTable.id,
                    escolha.autorizacaoId,
                  ),
                  eq(
                    autorizacoesProdutosRepresentantesTable.produtoId,
                    item.produtoId,
                  ),
                ),
              );
            if (!referencia) return;
            const [refVinculo] = await tx
              .select()
              .from(representantesFornecedoresTable)
              .where(
                eq(
                  representantesFornecedoresTable.id,
                  referencia.representanteFornecedorId,
                ),
              );
            if (!refVinculo) throw new Error("Vínculo indisponível.");
            const [fornecedor] = await tx
              .select()
              .from(fornecedoresTable)
              .where(eq(fornecedoresTable.id, refVinculo.fornecedorId))
              .for("share");
            const [vinculo] = await tx
              .select()
              .from(representantesFornecedoresTable)
              .where(eq(representantesFornecedoresTable.id, refVinculo.id))
              .for("share");
            const [regra] = await tx
              .select()
              .from(autorizacoesProdutosRepresentantesTable)
              .where(
                eq(
                  autorizacoesProdutosRepresentantesTable.id,
                  escolha.autorizacaoId,
                ),
              )
              .for("share");
            if (
              fornecedor?.status !== "ativo" ||
              !vinculo?.ativo ||
              !regra?.ativa ||
              !regra.comissaoAtiva ||
              regra.representanteFornecedorId !== vinculo.id ||
              vinculo.fornecedorId !== fornecedor.id ||
              regra.produtoId !== item.produtoId ||
              !regra.comissaoTipo ||
              regra.comissaoValor === null
            )
              throw new Error("Atribuição ou comissão inativa/inconsistente.");
            const [produto] = await tx
              .select({ tipo: productTable.productKind })
              .from(productTable)
              .where(eq(productTable.id, item.produtoId))
              .for("share");
            const precos = await tx
              .select({ tipo: productPricingTable.type })
              .from(productPricingTable)
              .where(eq(productPricingTable.productId, item.produtoId))
              .for("share");
            if (
              produto?.tipo !== "simple" ||
              precos.length !== 1 ||
              precos[0].tipo !== "dropshipping"
            )
              throw new Error(
                "Produto incompatível com operação de representante.",
              );
            const comerciais = await tx
              .select()
              .from(fornecedorProdutoVinculosTable)
              .where(
                and(
                  eq(
                    fornecedorProdutoVinculosTable.fornecedorId,
                    fornecedor.id,
                  ),
                  eq(fornecedorProdutoVinculosTable.produtoId, item.produtoId),
                ),
              )
              .for("share");
            if (comerciais.length !== 1 || comerciais[0].status !== "ativo")
              throw new Error(
                "Fornecedor não corresponde ao vínculo comercial do produto.",
              );
            const atribuicao = {
              representanteId: vinculo.usuarioId,
              representanteFornecedorId: vinculo.id,
              fornecedorId: fornecedor.id,
              produtoId: item.produtoId,
              autorizacaoId: regra.id,
            };
            const snapshot = criarSnapshotComissaoRepresentante({
              atribuicao,
              regra: {
                atribuicao,
                versao: regra.updatedAt.toISOString(),
                ativa: true,
                regra: { tipo: regra.comissaoTipo, valor: regra.comissaoValor },
              },
              item: baseComissionavelItem(item),
              ocorridoEm: new Date().toISOString(),
            });
            if (!snapshot) throw new Error("Snapshot indisponível.");

            await tx
              .insert(checkoutItemComissoesTable)
              .values({
                pedidoId,
                pedidoItemId: item.id,
                produtoId: item.produtoId,
                representanteUsuarioId: vinculo.usuarioId,
                fornecedorId: fornecedor.id,
                autorizacaoId: regra.id,
                snapshot,
                atribuidoPorUsuarioId: escolha.atualizadoPorUsuarioId,
              })
              .onConflictDoNothing({
                target: checkoutItemComissoesTable.pedidoItemId,
              });
          })
          .catch(() => {
            /* Configuração revogada/inválida: esta venda segue sem comissão. */
          });
      }
    });
  } catch {
    console.error("[comissoes:captura-indisponivel]", { pedidoId });
  }
}
