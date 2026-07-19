import "server-only";

import { isNull } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/table/categories/categories";
import {
  descreverErroBancoParaLog,
  executarLeituraComRetry,
} from "@/lib/db/classificar-erro-banco";

async function consultarCategoriasRaiz() {
  return db
    .select()
    .from(categoryTable)
    .where(isNull(categoryTable.parentId))
    .orderBy(categoryTable.orderIndex);
}

/**
 * Consulta compartilhada no request pelo React.cache. Falhas transitórias do
 * Neon são repetidas antes de usar o fallback vazio da navegação da loja.
 */
export const getCategories = cache(async () => {
  try {
    return await executarLeituraComRetry(
      "categorias:loja:navegacao",
      consultarCategoriasRaiz,
      200,
    );
  } catch (erro) {
    // A navegação é auxiliar: preserva a página, mas mantém o erro observável.
    console.warn("[categorias:loja:navegacao:indisponivel]", {
      ...descreverErroBancoParaLog(erro),
    });
    return [];
  }
});
