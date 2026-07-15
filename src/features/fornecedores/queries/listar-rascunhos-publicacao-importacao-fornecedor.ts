import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  fornecedorProdutoVinculosTable,
  marcaTable,
  produtoRascunhosTable,
} from "@/db/schema";
import type { RascunhoPublicacaoFornecedor } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { listarPendenciasRascunhoFornecedor } from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";

export async function listarRascunhosPublicacaoImportacaoFornecedor(
  importacaoId: string,
): Promise<RascunhoPublicacaoFornecedor[]> {
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
      const pendencias = listarPendenciasRascunhoFornecedor(rascunho).map(
        (pendencia) => pendencia.replace(/^Falta /, ""),
      );

      if (!rascunho.codigoFornecedor?.trim()) {
        pendencias.push("Código do fornecedor");
      }
      if (!rascunho.fornecedorId) pendencias.push("Fornecedor");

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
