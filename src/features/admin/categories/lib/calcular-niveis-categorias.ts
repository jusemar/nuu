export interface CategoriaHierarquia {
  id: string;
  parentId?: string | null;
}

/**
 * Calcula o nível pela cadeia real de pais. Pais inexistentes são tratados
 * como raiz para a listagem continuar utilizável até o gestor corrigir o dado.
 */
export function calcularNiveisReais(
  categorias: CategoriaHierarquia[],
): Map<string, number> {
  const categoriasPorId = new Map(
    categorias.map((categoria) => [categoria.id, categoria]),
  );
  const niveis = new Map<string, number>();

  function calcularNivel(id: string, caminho: Set<string>): number {
    const nivelExistente = niveis.get(id);
    if (nivelExistente !== undefined) return nivelExistente;

    const categoria = categoriasPorId.get(id);
    if (!categoria?.parentId || !categoriasPorId.has(categoria.parentId)) {
      niveis.set(id, 0);
      return 0;
    }

    if (caminho.has(id)) {
      throw new Error("A hierarquia de categorias contém um ciclo.");
    }

    const proximoCaminho = new Set(caminho).add(id);
    const nivel = calcularNivel(categoria.parentId, proximoCaminho) + 1;
    niveis.set(id, nivel);
    return nivel;
  }

  for (const categoria of categorias) calcularNivel(categoria.id, new Set());
  return niveis;
}

export function obterIdsDescendentes(
  categorias: CategoriaHierarquia[],
  categoriaId: string,
): Set<string> {
  const filhosPorPai = new Map<string, string[]>();

  for (const categoria of categorias) {
    if (!categoria.parentId) continue;
    const filhos = filhosPorPai.get(categoria.parentId) ?? [];
    filhos.push(categoria.id);
    filhosPorPai.set(categoria.parentId, filhos);
  }

  const descendentes = new Set<string>();
  const pendentes = [...(filhosPorPai.get(categoriaId) ?? [])];

  while (pendentes.length > 0) {
    const id = pendentes.shift()!;
    if (descendentes.has(id)) continue;
    descendentes.add(id);
    pendentes.push(...(filhosPorPai.get(id) ?? []));
  }

  return descendentes;
}
