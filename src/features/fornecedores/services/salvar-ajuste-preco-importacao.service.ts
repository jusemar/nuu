import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacaoFornecedorAjustesTable,
  importacoesFornecedorTable,
} from "@/db/schema";

import { ajustePrecoImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import type { EntradaAjustePrecoImportacaoFornecedor } from "../types/fornecedores.types";
import { calcularAjustesImportacaoFornecedor } from "./calcular-ajustes-importacao.service";

function normalizarValorAjuste(valor: string) {
  return valor.replace(",", ".");
}

async function validarAlvoAjuste(
  dados: EntradaAjustePrecoImportacaoFornecedor,
) {
  const [importacao] = await db
    .select({ id: importacoesFornecedorTable.id })
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.id, dados.importacaoId))
    .limit(1);

  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  if (dados.escopoAjuste === "categoria") {
    const [categoria] = await db
      .select({
        categoriaFornecedor: fornecedorProdutosStagingTable.categoriaFornecedor,
      })
      .from(fornecedorProdutosStagingTable)
      .where(
        and(
          eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId),
          eq(
            fornecedorProdutosStagingTable.categoriaFornecedor,
            dados.categoriaFornecedor ?? "",
          ),
        ),
      )
      .limit(1);

    if (!categoria) {
      throw new Error("Categoria do fornecedor não encontrada na importação.");
    }
  }

  if (dados.escopoAjuste === "produto") {
    const [produtoImportado] = await db
      .select({ id: fornecedorProdutosStagingTable.id })
      .from(fornecedorProdutosStagingTable)
      .where(
        and(
          eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId),
          eq(fornecedorProdutosStagingTable.id, dados.produtoStagingId ?? ""),
        ),
      )
      .limit(1);

    if (!produtoImportado) {
      throw new Error("Produto importado não encontrado.");
    }
  }
}

async function inativarAjusteAnterior(
  dados: EntradaAjustePrecoImportacaoFornecedor,
) {
  const base = [
    eq(importacaoFornecedorAjustesTable.importacaoId, dados.importacaoId),
    eq(importacaoFornecedorAjustesTable.escopoAjuste, dados.escopoAjuste),
    eq(importacaoFornecedorAjustesTable.status, "ativo"),
  ];

  if (dados.escopoAjuste === "categoria") {
    base.push(
      eq(
        importacaoFornecedorAjustesTable.categoriaFornecedor,
        dados.categoriaFornecedor ?? "",
      ),
    );
  }

  if (dados.escopoAjuste === "produto") {
    base.push(
      eq(
        importacaoFornecedorAjustesTable.produtoStagingId,
        dados.produtoStagingId ?? "",
      ),
    );
  }

  if (dados.escopoAjuste === "global") {
    base.push(isNull(importacaoFornecedorAjustesTable.categoriaFornecedor));
  }

  await db
    .update(importacaoFornecedorAjustesTable)
    .set({ status: "inativo", atualizadoEm: new Date() })
    .where(and(...base));
}

export async function salvarAjustePrecoImportacaoFornecedor(entrada: unknown) {
  const dadosValidados = ajustePrecoImportacaoFornecedorSchema.parse(entrada);
  const dados: EntradaAjustePrecoImportacaoFornecedor = {
    ...dadosValidados,
    valorAjuste: normalizarValorAjuste(dadosValidados.valorAjuste),
    categoriaFornecedor: dadosValidados.categoriaFornecedor || null,
    produtoStagingId: dadosValidados.produtoStagingId || null,
  };

  await validarAlvoAjuste(dados);
  await inativarAjusteAnterior(dados);

  const [ajuste] = await db
    .insert(importacaoFornecedorAjustesTable)
    .values({
      importacaoId: dados.importacaoId,
      tipoAjuste: dados.tipoAjuste,
      escopoAjuste: dados.escopoAjuste,
      valorAjuste: dados.valorAjuste,
      categoriaFornecedor:
        dados.escopoAjuste === "categoria" ? dados.categoriaFornecedor : null,
      produtoStagingId:
        dados.escopoAjuste === "produto" ? dados.produtoStagingId : null,
      status: "ativo",
    })
    .returning({ id: importacaoFornecedorAjustesTable.id });

  const resumo = await calcularAjustesImportacaoFornecedor(dados.importacaoId);

  return {
    ajusteId: ajuste.id,
    ...resumo,
  };
}
