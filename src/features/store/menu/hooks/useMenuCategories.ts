// =====================================================================
// HOOK: useMenuCategories
// =====================================================================
// Este hook é responsável por buscar as categorias para o menu da loja.
// 
// ARQUITETURA: Feature-based (modular por domínio)
// TECNOLOGIAS: TanStack Query, TypeScript
//
// COMO FUNCIONA:
// 1. Usa o TanStack Query (useQuery) para gerenciar cache e requisições
// 2. Chama o service getActiveCategories (server action)
// 3. Retorna os dados já em formato de árvore (com children)
// 4. Gerencia estados de loading e erro
//
// DIFERENÇA PARA O HOOK DO ADMIN:
// - Retorna apenas categorias ATIVAS (isActive = true)
// - Estrutura mais simples (só nome, slug, id)
// - Cache mais longo (staleTime maior) porque o menu muda pouco
// =====================================================================

import { useQuery } from '@tanstack/react-query'
import { getActiveCategories } from '../services/menuService'
import type { MenuCategory } from '../services/menuService'

// =====================================================================
// Chave de cache para o TanStack Query
// =====================================================================
// 'menu-categories' é a chave que identifica esta query no cache.
// Se precisar invalidar o cache (ex: após atualizar categorias),
// use esta mesma chave.
// =====================================================================
const MENU_CATEGORIES_KEY = ['menu-categories']

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================
// Retorna um objeto com:
// - data: Array de categorias em formato de árvore (ou [] enquanto carrega)
// - isLoading: booleano indicando se está carregando
// - error: erro, se houver
// - refetch: função para recarregar manualmente
// =====================================================================
export function useMenuCategories() {
  return useQuery<MenuCategory[]>({
    // Chave única para cache
    queryKey: MENU_CATEGORIES_KEY,
    
    // Função que busca os dados (executa no servidor)
    queryFn: async () => {
      try {
        // Chama o service que acessa o banco
        const categories = await getActiveCategories()
        return categories
      } catch (error) {
        console.error('Erro ao carregar categorias do menu:', error)
        return [] // Retorna array vazio em caso de erro
      }
    },
    
    // =================================================================
    // Configurações de cache
    // =================================================================
    // staleTime: 30 minutos - o menu muda pouco, não precisa buscar sempre
    // gcTime: 60 minutos - mantém no cache mesmo se não estiver em uso
    // refetchOnWindowFocus: false - não recarrega quando volta pra aba
    // =================================================================
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60,    // 60 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,      // Não recarrega quando o componente monta
    
    // =================================================================
    // Tratamento de erros
    // =================================================================
    retry: 2,                   // Tenta 2 vezes em caso de falha
    retryDelay: 1000,           // Espera 1 segundo entre tentativas
  })
}

// =====================================================================
// HOOK AUXILIAR: useMenuCategoriesFlat
// =====================================================================
// Versão alternativa que retorna a lista plana (sem hierarquia)
// Útil se precisar fazer buscas ou filtros específicos
// =====================================================================
export function useMenuCategoriesFlat() {
  const { data, ...rest } = useMenuCategories()
  
  // Função para achatar a árvore (converter para lista plana)
  const flattenTree = (cats: MenuCategory[]): MenuCategory[] => {
    let flat: MenuCategory[] = []
    cats.forEach(cat => {
      flat.push(cat)
      if (cat.children) {
        flat = [...flat, ...flattenTree(cat.children)]
      }
    })
    return flat
  }

  return {
    data: data ? flattenTree(data) : [],
    ...rest
  }
}

// =====================================================================
// HOOK AUXILIAR: useMenuCategoryById
// =====================================================================
// Busca uma categoria específica pelo ID (útil para breadcrumbs)
// =====================================================================
export function useMenuCategoryById(id: string | null) {
  const { data: categories } = useMenuCategoriesFlat()
  
  if (!id || !categories) return null
  
  return categories.find(cat => cat.id === id) || null
}

// =====================================================================
// EXEMPLO DE USO NO COMPONENTE:
// =====================================================================
// function NavigationDrawer() {
//   const { data: categories, isLoading } = useMenuCategories()
//   
//   if (isLoading) return <div>Carregando...</div>
//   
//   return (
//     <div>
//       {categories?.map(category => (
//         <CategoryItem key={category.id} category={category} />
//       ))}
//     </div>
//   )
// }
// =====================================================================