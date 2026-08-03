import "server-only";

import { sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";

export type CategoriaSubarvorePublica = {
  id: string;
  parentId: string | null;
};

export function coletarIdsCategoriaEDescendentes(
  categoriaId: string,
  arvore: CategoriaSubarvorePublica[],
) {
  const ids = new Set<string>([categoriaId]);
  const pendentes = [categoriaId];

  while (pendentes.length > 0) {
    const paiId = pendentes.pop();

    arvore.forEach((categoria) => {
      if (categoria.parentId !== paiId || ids.has(categoria.id)) return;
      ids.add(categoria.id);
      pendentes.push(categoria.id);
    });
  }

  return ids;
}

/**
 * Retorna a categoria informada e todos os descendentes ativos.
 * O caminho visitado impede repetição caso existam dados cíclicos inválidos.
 */
export const buscarArvoreCategoriaPublica = cache(
  async (categoriaId: string): Promise<CategoriaSubarvorePublica[]> => {
    const resultado = await db.execute(sql`
      WITH RECURSIVE arvore_categoria AS (
        SELECT id, parent_id, ARRAY[id] AS caminho
        FROM category
        WHERE id = ${categoriaId}
          AND is_active = true

        UNION ALL

        SELECT filha.id, filha.parent_id, arvore_categoria.caminho || filha.id
        FROM category filha
        INNER JOIN arvore_categoria
          ON filha.parent_id = arvore_categoria.id
        WHERE filha.is_active = true
          AND NOT filha.id = ANY(arvore_categoria.caminho)
      )
      SELECT DISTINCT id, parent_id
      FROM arvore_categoria
    `);

    return resultado.rows.map((categoria) => ({
      id: String(categoria.id),
      parentId: categoria.parent_id ? String(categoria.parent_id) : null,
    }));
  },
);
