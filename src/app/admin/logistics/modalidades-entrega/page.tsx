// src/app/admin/logistics/modalidades-entrega/page.tsx
// 
// Este arquivo é uma ROTA (Route) do Next.js App Router.
// Ele define o que será exibido quando o usuário acessar:
// /admin/logistics/modalidades-entrega
//
// O App Router procura automaticamente por arquivos chamados "page.tsx"
// dentro de pastas para criar as rotas da aplicação.

import { ModalidadesEntregaPage } from "@/features/admin/logistics/modalidadesEntrega/components/ModalidadesEntregaPage";

// Exportação padrão do componente que será renderizado nesta rota
// O Next.js automaticamente renderiza o componente exportado como default
export default function Page() {
  // Apenas retorna o componente da nossa feature de logística
  // Toda a lógica, UI e estados estão dentro do componente ModalidadesEntregaPage
  return <ModalidadesEntregaPage />;
}