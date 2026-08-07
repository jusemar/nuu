import "server-only";

import { getAllCategories } from "@/features/admin/categories/services/categoryService";
import { listarMarcasAtivas } from "@/features/admin/marcas/services/marcaService";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

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
  // A página do Mapeamento já trata a falha desta leitura caindo para listas vazias
  // (`listarOpcoesMapeamentoFornecedorComFallback`). A retentativa vem antes disso: uma
  // oscilação momentânea do banco não deve custar ao usuário os selects de categoria e
  // marca, que são justamente o que ele precisa para concluir o mapeamento.
  const [categorias, marcas] = await executarLeituraFornecedores(
    {
      etapa: "mapeamento:listar-opcoes-loja",
      mensagemAmigavel:
        "Não foi possível carregar categorias e marcas da loja agora. Tente novamente em alguns segundos.",
    },
    () => Promise.all([getAllCategories(), listarMarcasAtivas()]),
  );
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
