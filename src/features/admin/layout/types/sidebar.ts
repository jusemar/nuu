/**
 * TIPOS DO SIDEBAR - Sistema de Navegação Hierárquica
 * 
 * Este arquivo define como será a estrutura de dados do nosso menu.
 * Usamos TypeScript para garantir que todo menu siga o mesmo formato.
 */

/**
 * Item individual de menu - a unidade básica de navegação
 * Exemplo: "Dashboard", "Produtos", "Estados"
 */
export interface MenuItem {
  /** Identificador único do item (usado nas chaves do React) */
  id: string;
  
  /** Texto que aparece para o usuário */
  label: string;
  
  /** Para onde o link leva quando clicado */
  href: string;
  
  /** Ícone do Lucide React (ex: LayoutDashboard, Package, Truck) */
  icon: string; // Nome do ícone como string, resolvemos no componente
  
  /** Se este item está ativo no momento (página atual) */
  isActive?: boolean;
}

/**
 * Grupo de menu - agrupa vários itens relacionados
 * Exemplo: "Catálogo" (contém Produtos + Categorias)
 * Exemplo: "Logística" (contém Regiões + Métodos + Fornecedores)
 */
export interface MenuGroup {
  /** Identificador único do grupo */
  id: string;
  
  /** Título do grupo que aparece no menu */
  label: string;
  
  /** Ícone que representa o grupo todo */
  icon: string;
  
  /** Lista de itens dentro deste grupo */
  items: MenuItem[];
  
  /** Se o grupo está expandido mostrando seus itens */
  isExpanded?: boolean;
}

/**
 * Item especial: Regiões de Atendimento
 * Tem sub-itens próprios (Estados, Cidades, Testar)
 * Por isso estende MenuGroup em vez de ser MenuItem simples
 */
export interface RegionSubmenu extends MenuGroup {
  /** Identificador fixo para reconhecer este tipo especial */
  type: 'region-submenu';
}

/**
 * Estrutura completa do menu do admin
 * Combina itens soltos (Dashboard) com grupos (Catálogo, Logística)
 */
export type SidebarMenu = Array<MenuItem | MenuGroup | RegionSubmenu>;

/**
 * Estado de controle do sidebar
 * Guarda o que está aberto/fechado para lembrar quando navegar
 */
export interface SidebarState {
  /** Se o sidebar está recolhido (só ícones) ou expandido (ícones + texto) */
  isCollapsed: boolean;
  
  /** IDs dos grupos que estão expandidos no momento */
  expandedGroups: string[];
  
  /** Se está aberto no mobile (menu hamburger) */
  isMobileOpen: boolean;
}