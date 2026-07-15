import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { categoryTable, marcaTable, produtoRascunhosTable } from "@/db/schema";
import {
  extrairConfiguracaoComercialRascunhoFornecedor,
  extrairSecoesLojaRascunhoFornecedor,
  listarPendenciasRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";

export type RascunhoImportacaoFornecedor = {
  id: string;
  stagingId: string | null;
  codigoFornecedor: string | null;
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  categoriaNome: string | null;
  marcaId: string | null;
  marcaNome: string | null;
  ean: string | null;
  ncm: string | null;
  precoFornecedor: string | null;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  peso: string | null;
  altura: string | null;
  largura: string | null;
  comprimento: string | null;
  imagens: string[];
  secoesLoja: string[];
  configuracaoComercial: ReturnType<
    typeof extrairConfiguracaoComercialRascunhoFornecedor
  >;
  pendencias: string[];
  status: "rascunho" | "pendente_conciliacao" | "pronto_para_publicar";
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairStagingId(dadosOrigemJson: unknown) {
  if (!ehRegistro(dadosOrigemJson)) return null;

  const origem = dadosOrigemJson.origemFluxoFornecedor;
  if (!ehRegistro(origem) || typeof origem.stagingId !== "string") return null;

  return origem.stagingId;
}

export async function listarRascunhosImportacaoFornecedor(
  importacaoId: string,
): Promise<RascunhoImportacaoFornecedor[]> {
  const linhas = await db
    .select({
      id: produtoRascunhosTable.id,
      codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
      nome: produtoRascunhosTable.nome,
      descricao: produtoRascunhosTable.descricao,
      categoriaId: produtoRascunhosTable.categoriaId,
      categoriaNome: categoryTable.name,
      marcaId: produtoRascunhosTable.marcaId,
      marcaNome: marcaTable.nome,
      ean: produtoRascunhosTable.ean,
      ncm: produtoRascunhosTable.ncm,
      precoFornecedor: produtoRascunhosTable.precoFornecedor,
      precoLoja: produtoRascunhosTable.precoLoja,
      estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
      peso: produtoRascunhosTable.peso,
      altura: produtoRascunhosTable.altura,
      largura: produtoRascunhosTable.largura,
      comprimento: produtoRascunhosTable.comprimento,
      imagens: produtoRascunhosTable.imagens,
      dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
      status: produtoRascunhosTable.status,
    })
    .from(produtoRascunhosTable)
    .leftJoin(
      categoryTable,
      eq(produtoRascunhosTable.categoriaId, categoryTable.id),
    )
    .leftJoin(marcaTable, eq(produtoRascunhosTable.marcaId, marcaTable.id))
    .where(
      and(
        eq(produtoRascunhosTable.origemTipo, "fornecedor_excel"),
        eq(produtoRascunhosTable.origemProvedor, "arquivo_excel"),
        inArray(produtoRascunhosTable.status, [
          "rascunho",
          "pendente_conciliacao",
          "pronto_para_publicar",
        ]),
        sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
      ),
    );

  return linhas.map(({ dadosOrigemJson, ...linha }) => {
    const secoesLoja = extrairSecoesLojaRascunhoFornecedor(dadosOrigemJson);
    const configuracaoComercial =
      extrairConfiguracaoComercialRascunhoFornecedor(dadosOrigemJson);
    const pendencias = listarPendenciasRascunhoFornecedor({
      nome: linha.nome,
      categoriaId: linha.categoriaId,
      marcaId: linha.marcaId,
      precoLoja: linha.precoLoja,
      dadosOrigemJson,
    });

    return {
      ...linha,
      status: linha.status as RascunhoImportacaoFornecedor["status"],
      stagingId: extrairStagingId(dadosOrigemJson),
      imagens: linha.imagens ?? [],
      secoesLoja,
      configuracaoComercial,
      pendencias,
    };
  });
}
