import "server-only";

import { getAllCategories } from "@/features/admin/categories/services/categoryService";
import { listarMarcasAtivas } from "@/features/admin/marcas/services/marcaService";

export type OpcaoMapeamentoFornecedorLoja = {
  id: string;
  nome: string;
};

type CategoriaLojaMapeamento = {
  id: string;
  name: string;
  parentId?: string | null;
  isActive: boolean;
};

function montarNomeCategoriaHierarquica(
  categoria: CategoriaLojaMapeamento,
  categoriasPorId: Map<string, CategoriaLojaMapeamento>,
) {
  const nomes = [categoria.name];
  const visitados = new Set<string>([categoria.id]);
  let parentId = categoria.parentId;

  while (parentId && !visitados.has(parentId)) {
    const pai = categoriasPorId.get(parentId);
    if (!pai) break;

    nomes.unshift(pai.name);
    visitados.add(pai.id);
    parentId = pai.parentId;
  }

  return nomes.join(" > ");
}

export async function listarOpcoesMapeamentoFornecedor(): Promise<{
  categoriasLoja: OpcaoMapeamentoFornecedorLoja[];
  marcasLoja: OpcaoMapeamentoFornecedorLoja[];
}> {
  const [categorias, marcas] = await Promise.all([
    getAllCategories(),
    listarMarcasAtivas(),
  ]);
  const categoriasAtivas = categorias.filter((categoria) => categoria.isActive);
  const categoriasPorId = new Map(
    categoriasAtivas.map((categoria) => [categoria.id, categoria]),
  );

  return {
    categoriasLoja: categoriasAtivas
      .map((categoria) => ({
        id: categoria.id,
        nome: montarNomeCategoriaHierarquica(categoria, categoriasPorId),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    marcasLoja: marcas.map((marca) => ({
      id: marca.id,
      nome: marca.nome,
    })),
  };
}
