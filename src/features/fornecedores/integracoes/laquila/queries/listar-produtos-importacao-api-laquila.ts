import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorIntegracoesApiTable } from "@/db/schema";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";
import { obterAmbienteAplicacaoLaquila } from "../lib/ambiente-laquila";
import type { ImportacaoApiLaquila } from "./buscar-importacao-api-laquila";
import {
  listarProdutosApiStagingLaquilaCatalogo,
  type ProdutoApiStagingLaquilaCatalogo,
} from "./listar-produtos-api-staging-laquila";

export type ProdutosImportacaoApiLaquila = {
  produtos: ProdutoApiStagingLaquilaCatalogo[];
  totalAposRecorte: number;
  consultadoEm: string | null;
};

async function resolverIntegracaoApiId(importacao: ImportacaoApiLaquila) {
  if (importacao.integracaoApiId) return importacao.integracaoApiId;

  // Execuções gravadas antes de `configuracaoFluxoJson` carregar a integração
  // caem aqui: a Laquila tem uma integração só, então resolvê-la pelo provedor
  // é seguro e evita uma tela vazia sem explicação.
  const [integracao] = await db
    .select({ id: fornecedorIntegracoesApiTable.id })
    .from(fornecedorIntegracoesApiTable)
    .where(
      and(
        eq(fornecedorIntegracoesApiTable.provedor, PROVEDOR_INTEGRACAO_LAQUILA),
        eq(fornecedorIntegracoesApiTable.ambiente, ambiente),
      ),
    )
    .limit(1);

  return integracao?.id ?? null;
}

/**
 * Produtos de UMA execução da API, lidos do staging persistido.
 *
 * Nenhuma chamada à Laquila acontece aqui — é exatamente essa a diferença
 * entre reabrir uma importação e iniciar uma nova sincronização. Reabrir #101
 * amanhã devolve o que a API respondeu quando #101 foi criada, com as decisões
 * já tomadas preservadas.
 */
export async function listarProdutosImportacaoApiLaquila(
  importacao: ImportacaoApiLaquila,
): Promise<ProdutosImportacaoApiLaquila> {
  const integracaoApiId = await resolverIntegracaoApiId(importacao);
  const produtos = await listarProdutosApiStagingLaquilaCatalogo(
    integracaoApiId,
    { importacaoId: importacao.id },
  );

  return {
    produtos,
    totalAposRecorte: produtos.length,
    consultadoEm:
      produtos[0]?.recebidoEm?.toISOString() ??
      importacao.criadoEm.toISOString(),
  };
}
const ambiente = obterAmbienteAplicacaoLaquila();
