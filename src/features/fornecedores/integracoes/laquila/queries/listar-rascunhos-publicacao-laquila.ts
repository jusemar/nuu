import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  produtoRascunhosTable,
} from "@/db/schema";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

export type RascunhoPublicacaoLaquila = {
  id: string;
  codigoFornecedor: string | null;
  nome: string;
  categoriaNome: string | null;
  marcaNome: string | null;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  imagemUrl: string | null;
  pronto: boolean;
  pendencias: string[];
};

function possuiSecaoLoja(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const registro = valor as Record<string, unknown>;
  const produtoRascunho = registro.produtoRascunho;
  const secoesProduto =
    produtoRascunho &&
    typeof produtoRascunho === "object" &&
    !Array.isArray(produtoRascunho)
      ? (produtoRascunho as Record<string, unknown>).storeProductFlags
      : undefined;
  const secoes = Array.isArray(registro.secoesLoja)
    ? registro.secoesLoja
    : secoesProduto;

  return (
    Array.isArray(secoes) && secoes.some((secao) => typeof secao === "string")
  );
}

export async function listarRascunhosPublicacaoLaquila(): Promise<
  RascunhoPublicacaoLaquila[]
> {
  const rascunhos = await db
    .select({
      id: produtoRascunhosTable.id,
      fornecedorId: produtoRascunhosTable.fornecedorId,
      codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
      nome: produtoRascunhosTable.nome,
      categoriaId: produtoRascunhosTable.categoriaId,
      categoriaNome: categoryTable.name,
      marcaId: produtoRascunhosTable.marcaId,
      marcaNome: marcaTable.nome,
      precoLoja: produtoRascunhosTable.precoLoja,
      estoqueFornecedor: produtoRascunhosTable.estoqueFornecedor,
      imagens: produtoRascunhosTable.imagens,
      dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
    })
    .from(produtoRascunhosTable)
    .leftJoin(
      categoryTable,
      eq(produtoRascunhosTable.categoriaId, categoryTable.id),
    )
    .leftJoin(marcaTable, eq(produtoRascunhosTable.marcaId, marcaTable.id))
    .where(
      and(
        eq(produtoRascunhosTable.origemTipo, "fornecedor_api"),
        eq(produtoRascunhosTable.origemProvedor, PROVEDOR_INTEGRACAO_LAQUILA),
        inArray(produtoRascunhosTable.status, [
          "rascunho",
          "pendente_conciliacao",
          "pronto_para_publicar",
        ]),
      ),
    );

  const fornecedoresIds = Array.from(
    new Set(
      rascunhos
        .map((rascunho) => rascunho.fornecedorId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const vinculos =
    fornecedoresIds.length > 0
      ? await db
          .select({
            fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
            codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
          })
          .from(fornecedorProdutoVinculosTable)
          .where(
            and(
              inArray(
                fornecedorProdutoVinculosTable.fornecedorId,
                fornecedoresIds,
              ),
              eq(fornecedorProdutoVinculosTable.status, "ativo"),
            ),
          )
      : [];
  const chavesPublicadas = new Set(
    vinculos.map(
      (vinculo) => `${vinculo.fornecedorId}:${vinculo.codigoFornecedor ?? ""}`,
    ),
  );

  return rascunhos
    .filter(
      (rascunho) =>
        !rascunho.fornecedorId ||
        !chavesPublicadas.has(
          `${rascunho.fornecedorId}:${rascunho.codigoFornecedor ?? ""}`,
        ),
    )
    .map((rascunho) => {
      const pendencias: string[] = [];
      if (!rascunho.nome.trim()) pendencias.push("Nome");
      if (!rascunho.codigoFornecedor?.trim())
        pendencias.push("Código do fornecedor");
      if (!rascunho.fornecedorId) pendencias.push("Fornecedor");
      if (!rascunho.categoriaId) pendencias.push("Categoria");
      if (!rascunho.marcaId) pendencias.push("Marca");
      if (!rascunho.precoLoja || Number(rascunho.precoLoja) <= 0) {
        pendencias.push("Preço da loja");
      }
      if (!possuiSecaoLoja(rascunho.dadosOrigemJson)) {
        pendencias.push("Seção da loja");
      }

      return {
        id: rascunho.id,
        codigoFornecedor: rascunho.codigoFornecedor,
        nome: rascunho.nome,
        categoriaNome: rascunho.categoriaNome,
        marcaNome: rascunho.marcaNome,
        precoLoja: rascunho.precoLoja,
        estoqueFornecedor: rascunho.estoqueFornecedor,
        imagemUrl: rascunho.imagens[0] ?? null,
        pronto: pendencias.length === 0,
        pendencias,
      };
    });
}
