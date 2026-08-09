import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutoVinculosTable,
  productTable,
} from "@/db/schema";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

export type VinculoProdutoLaquila = {
  vinculoId: string;
  codigoFornecedor: string;
  produto: {
    id: string;
    nome: string;
    sku: string;
    categoria: string | null;
    preco: string | null;
  };
};

/**
 * Vínculos permanentes do fornecedor Laquila.
 *
 * NÃO recebe `importacaoId` de propósito: vínculo é permanente
 * (`fornecedorId + codigoFornecedor → produtoId`) e vale para todas as
 * execuções futuras. É a importação que é histórica, não o vínculo — por isso
 * a #102 reaproveita o que a #101 já vinculou em vez de vincular de novo.
 */
export async function listarVinculosProdutosLaquila() {
  const [integracao] = await db
    .select({ fornecedorId: fornecedorIntegracoesApiTable.fornecedorId })
    .from(fornecedorIntegracoesApiTable)
    .where(
      eq(fornecedorIntegracoesApiTable.provedor, PROVEDOR_INTEGRACAO_LAQUILA),
    )
    .limit(1);

  if (!integracao) {
    return { fornecedorId: null, vinculos: [] as VinculoProdutoLaquila[] };
  }

  const linhas = await db
    .select({
      vinculoId: fornecedorProdutoVinculosTable.id,
      codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
      produtoId: productTable.id,
      produtoNome: productTable.name,
      produtoSku: productTable.sku,
      produtoPrecoCentavos: sql<number | null>`(
        select preco.price_in_cents
        from product_pricing preco
        where preco.product_id = ${productTable.id}
          and preco.is_active = true
        order by preco.main_card_price desc nulls last, preco.created_at asc
        limit 1
      )`,
    })
    .from(fornecedorProdutoVinculosTable)
    .innerJoin(
      productTable,
      eq(fornecedorProdutoVinculosTable.produtoId, productTable.id),
    )
    .where(
      and(
        eq(
          fornecedorProdutoVinculosTable.fornecedorId,
          integracao.fornecedorId,
        ),
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
      ),
    );

  return {
    fornecedorId: integracao.fornecedorId,
    vinculos: linhas.flatMap((linha) => {
      const codigoFornecedor = linha.codigoFornecedor?.trim();
      if (!codigoFornecedor) return [];

      return [
        {
          vinculoId: linha.vinculoId,
          codigoFornecedor,
          produto: {
            id: linha.produtoId,
            nome: linha.produtoNome,
            sku: linha.produtoSku,
            categoria: null,
            preco:
              typeof linha.produtoPrecoCentavos === "number"
                ? (linha.produtoPrecoCentavos / 100).toFixed(2)
                : null,
          },
        },
      ];
    }),
  };
}
