import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedoresTable,
  fornecedorIntegracoesApiTable,
  fornecedorProdutoVinculosTable,
  productTable,
} from "@/db/schema";
import { obterAmbienteAplicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/ambiente-laquila";
import {
  type CodigoProblemaDiagnosticoLogistico,
  diagnosticarLogisticaProduto,
  type DiagnosticoLogisticoProduto,
  type VinculoLogisticoProduto,
} from "@/features/logistica/lib/diagnosticar-logistica-produto";

export type ProdutoComDiagnosticoLogistico = {
  id: string;
  nome: string;
  sku: string;
  slug: string;
  ativo: boolean | null;
  status: string | null;
  pesoEmGramas: number | null;
  alturaEmCm: number | null;
  larguraEmCm: number | null;
  comprimentoEmCm: number | null;
  tiposEntregaPermitidos: string[] | null;
  permiteRetirada: boolean | null;
  diagnostico: DiagnosticoLogisticoProduto;
};

export type ResumoAuditoriaLogistica = {
  total: number;
  validos: number;
  invalidos: number;
  multiplosProblemas: number;
  porProblema: Record<CodigoProblemaDiagnosticoLogistico, number>;
  porOrigem: Array<{
    chave: string;
    rotulo: string;
    total: number;
    validos: number;
    invalidos: number;
  }>;
};

const codigosProblemas: CodigoProblemaDiagnosticoLogistico[] = [
  "PESO_AUSENTE",
  "PESO_INVALIDO",
  "ALTURA_AUSENTE",
  "ALTURA_INVALIDA",
  "LARGURA_AUSENTE",
  "LARGURA_INVALIDA",
  "COMPRIMENTO_AUSENTE",
  "COMPRIMENTO_INVALIDO",
  "ORIGEM_ENVIO_AUSENTE",
  "CONFIGURACAO_TRANSPORTE_INVALIDA",
  "VINCULO_FORNECEDOR_AUSENTE",
  "CODIGO_FORNECEDOR_AUSENTE",
  "CONFIGURACAO_LOGISTICA_INVALIDA",
];

/**
 * Carrega produtos e vínculos em duas leituras em lote. Nenhuma API de
 * fornecedor é consultada durante auditoria, dashboard ou vitrine.
 */
export async function listarDiagnosticosLogisticosProdutos(
  produtoIds?: readonly string[],
): Promise<ProdutoComDiagnosticoLogistico[]> {
  const ids = produtoIds ? [...new Set(produtoIds)] : undefined;
  if (ids?.length === 0) return [];

  const ambiente = obterAmbienteAplicacaoLaquila();
  const produtos = await db
    .select({
      id: productTable.id,
      nome: productTable.name,
      sku: productTable.sku,
      slug: productTable.slug,
      ativo: productTable.isActive,
      status: productTable.status,
      pesoEmGramas: productTable.weight,
      alturaEmCm: productTable.height,
      larguraEmCm: productTable.width,
      comprimentoEmCm: productTable.length,
      tiposEntregaPermitidos: productTable.allowedDeliveryTypes,
      permiteRetirada: productTable.allowsPickup,
    })
    .from(productTable)
    .where(ids ? inArray(productTable.id, ids) : undefined);
  const produtosIds = produtos.map((produto) => produto.id);

  const linhasVinculos =
    produtosIds.length === 0
      ? []
      : await db
          .select({
            produtoId: fornecedorProdutoVinculosTable.produtoId,
            fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
            fornecedorNome: fornecedoresTable.nome,
            vinculoStatus: fornecedorProdutoVinculosTable.status,
            codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
            provedor: fornecedorIntegracoesApiTable.provedor,
          })
          .from(fornecedorProdutoVinculosTable)
          .innerJoin(
            fornecedoresTable,
            eq(
              fornecedoresTable.id,
              fornecedorProdutoVinculosTable.fornecedorId,
            ),
          )
          .leftJoin(
            fornecedorIntegracoesApiTable,
            and(
              eq(
                fornecedorIntegracoesApiTable.fornecedorId,
                fornecedorProdutoVinculosTable.fornecedorId,
              ),
              eq(fornecedorIntegracoesApiTable.ambiente, ambiente),
            ),
          )
          .where(
            inArray(fornecedorProdutoVinculosTable.produtoId, produtosIds),
          );

  const vinculosPorProduto = new Map<string, VinculoLogisticoProduto[]>();
  for (const linha of linhasVinculos) {
    const atuais = vinculosPorProduto.get(linha.produtoId) ?? [];
    atuais.push({
      fornecedorId: linha.fornecedorId,
      fornecedorNome: linha.fornecedorNome,
      vinculoStatus: linha.vinculoStatus,
      codigoFornecedor: linha.codigoFornecedor,
      provedor: linha.provedor,
    });
    vinculosPorProduto.set(linha.produtoId, atuais);
  }

  return produtos.map((produto) => ({
    ...produto,
    diagnostico: diagnosticarLogisticaProduto({
      produto: {
        id: produto.id,
        pesoEmGramas: produto.pesoEmGramas,
        alturaEmCm: produto.alturaEmCm,
        larguraEmCm: produto.larguraEmCm,
        comprimentoEmCm: produto.comprimentoEmCm,
        tiposEntregaPermitidos: produto.tiposEntregaPermitidos,
        permiteRetirada: produto.permiteRetirada,
      },
      vinculos: vinculosPorProduto.get(produto.id) ?? [],
    }),
  }));
}

export function resumirAuditoriaLogisticaProdutos(
  produtos: readonly ProdutoComDiagnosticoLogistico[],
): ResumoAuditoriaLogistica {
  const porProblema = Object.fromEntries(
    codigosProblemas.map((codigo) => [codigo, 0]),
  ) as Record<CodigoProblemaDiagnosticoLogistico, number>;
  const porOrigem = new Map<
    string,
    ResumoAuditoriaLogistica["porOrigem"][number]
  >();

  for (const produto of produtos) {
    for (const problema of produto.diagnostico.problemas) {
      porProblema[problema.codigo] += 1;
    }

    const origem = produto.diagnostico.origem;
    const resumoOrigem = porOrigem.get(origem.chave) ?? {
      chave: origem.chave,
      rotulo: origem.rotulo,
      total: 0,
      validos: 0,
      invalidos: 0,
    };
    resumoOrigem.total += 1;
    if (produto.diagnostico.valido) resumoOrigem.validos += 1;
    else resumoOrigem.invalidos += 1;
    porOrigem.set(origem.chave, resumoOrigem);
  }

  const invalidos = produtos.filter(
    (produto) => !produto.diagnostico.valido,
  ).length;
  return {
    total: produtos.length,
    validos: produtos.length - invalidos,
    invalidos,
    multiplosProblemas: produtos.filter(
      (produto) => produto.diagnostico.problemas.length > 1,
    ).length,
    porProblema,
    porOrigem: [...porOrigem.values()].sort((a, b) =>
      a.rotulo.localeCompare(b.rotulo, "pt-BR"),
    ),
  };
}

export async function auditarLogisticaProdutos() {
  const produtos = await listarDiagnosticosLogisticosProdutos();
  return {
    produtos,
    resumo: resumirAuditoriaLogisticaProdutos(produtos),
  };
}
