// =====================================================================
// HOOK: useUpdateCategory
// =====================================================================
// Este hook é responsável por ATUALIZAR uma categoria existente.
// Ele faz parte da camada de lógica da nossa arquitetura feature-based.
//
// FLUXO COMPLETO:
// 1. O usuário interage com a interface (ex: clica no Switch)
// 2. O componente chama este hook
// 3. O hook chama o service (que acessa o banco)
// 4. O hook gerancia o estado da requisição (loading, sucesso, erro)
// 5. O hook atualiza o cache do TanStack Query
// 6. O hook mostra feedback visual (toast)
// =====================================================================

// Importações necessárias
import { useMutation, useQueryClient } from '@tanstack/react-query' // TanStack Query para mutations e cache
import { updateCategory } from '../services/categoryService' // Função que realmente altera o banco
import { categoryKeys } from './query-keys' // Chaves de cache para categorias
import { toast } from 'sonner' // Biblioteca de toasts (notificações)
import type { UpdateCategoryInput } from '../types' // Tipo para os dados de atualização

// =====================================================================
// PASSO 1: Definir o tipo dos parâmetros que o hook recebe
// =====================================================================
// Este tipo define a estrutura dos dados que a função mutate vai receber:
// - id: identificador da categoria a ser atualizada
// - data: campos que serão alterados (todos opcionais)
type UpdateCategoryParams = {
  id: string
  data: UpdateCategoryInput
}

// =====================================================================
// PASSO 2: Criar o hook propriamente dito
// =====================================================================
export function useUpdateCategory() {
  // PASSO 2.1: Inicializar o queryClient para manipular o cache
  // O queryClient nos permite invalidar queries, ler dados do cache, etc.
  const queryClient = useQueryClient()

  // PASSO 2.2: Retornar uma mutation do TanStack Query
  // useMutation é um hook do TanStack Query para operações de escrita
  // (create, update, delete) no servidor.
  return useMutation({
    
    // =================================================================
    // PASSO 3: Definir a função que executa a operação
    // =================================================================
    // mutationFn é a função que será chamada quando quisermos atualizar
    // Ela recebe os parâmetros que definimos acima e chama o service.
    mutationFn: ({ id, data }: UpdateCategoryParams) => 
      updateCategory(id, data), // ← Chama o service (server action)
    
    // =================================================================
    // PASSO 4: Lidar com o SUCESSO da operação
    // =================================================================
    // onSuccess é executado quando a mutation é bem-sucedida.
    // Recebe os dados retornados e os parâmetros enviados.
    onSuccess: (_, variables) => {
      
      // PASSO 4.1: Invalidar queries para forçar recarregamento
      // Isso garante que a lista de categorias seja recarregada
      // mostrando os dados atualizados.
      queryClient.invalidateQueries({ 
        queryKey: categoryKeys.lists() // Invalida TODAS as listas
      })
      
      // PASSO 4.2: Invalidar o cache individual da categoria
      // Isso atualiza os detalhes da categoria específica na página de edição.
      queryClient.invalidateQueries({ 
        queryKey: categoryKeys.detail(variables.id) 
      })
      
      // PASSO 4.3: Mostrar toast de sucesso
      // Feedback visual para o usuário.
      toast.success('✅ Categoria atualizada com sucesso!')
    },
    
    // =================================================================
    // PASSO 5: Lidar com o ERRO da operação
    // =================================================================
    // onError é executado quando a mutation falha.
    // Recebe o erro e os parâmetros que foram enviados.
    onError: (error) => {
      
      // PASSO 5.1: Mostrar toast de erro
      // Feedback visual informando o problema.
      toast.error('❌ Erro ao atualizar categoria', {
        description: error.message, // Mensagem detalhada do erro
      })
    }
  })
}

// =====================================================================
// RESUMO DO FLUXO PARA INICIANTES:
// =====================================================================
// 1. O componente chama: updateCategory({ id: "123", data: { isActive: true } })
// 2. O hook executa a mutationFn → chama updateCategory no service
// 3. O service executa a query no banco
// 4. Se der certo: onSuccess → atualiza cache + mostra toast verde
// 5. Se der erro: onError → mostra toast vermelho
// 6. O componente reage aos novos dados (via queryClient)
// =====================================================================