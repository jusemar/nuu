import "server-only";

import { and, eq } from "drizzle-orm";

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
      produtoPrecoCentavos: productTable.salePrice,
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
