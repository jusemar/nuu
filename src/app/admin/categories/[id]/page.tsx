// Este arquivo faz parte do Next.js App Router
// Ele define a rota: /admin/categories/[id]
// [id] é um parâmetro dinâmico (ex: /admin/categories/123)

// Importa o componente de edição que está na nossa feature
// O caminho @/ aponta para a pasta src/
import EditCategoryPage from '@/features/admin/categories/routes/EditCategoryPage'

// Esta é a página que será renderizada quando alguém acessar a URL
// O Next.js automaticamente passa o parâmetro id para o componente
export default function Page() {
  // Apenas renderiza o componente da feature
  // Toda a lógica de edição fica dentro de EditCategoryPage
  return <EditCategoryPage/>
}