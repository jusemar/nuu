/**
 * COMPONENTE SIDEBAR - Menu lateral de navegação do admin
 * 
 * Estrutura do menu:
 * - Dashboard (item solto)
 * - Catálogo (grupo expansível: Produtos, Categorias)
 * - Logística (grupo expansível: Regiões, Métodos, Fornecedores)
 * - Pedidos (item solto)
 * - Clientes (item solto)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderIcon,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Store,
  Building2,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '../hooks/useSidebar';

/**
 * Mapeamento de nomes de ícones para componentes do Lucide
 */
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Package,
  FolderIcon,
  ShoppingCart,
  Users,
  Truck,
  MapPin,
  Store,
  Building2,
  Navigation,
};

/**
 * Dados do menu - estrutura hierárquica completa
 */
const menuData = [
  // Item solto: Dashboard
  {
    id: 'dashboard',
    type: 'item' as const,
    label: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
  },
  
  // Grupo: Catálogo
  {
    id: 'catalog',
    type: 'group' as const,
    label: 'Catálogo',
    icon: 'Package',
    items: [
      { id: 'products', label: 'Produtos', href: '/admin/products', icon: 'Package' },
      { id: 'categories', label: 'Categorias', href: '/admin/categories', icon: 'FolderIcon' },
    ],
  },
  
  // Grupo: Logística
  {
    id: 'logistics',
    type: 'group' as const,
    label: 'Logística',
    icon: 'Truck',
    items: [
      // Regiões de Atendimento (subgrupo)
      {
        id: 'regions',
        type: 'subgroup' as const,
        label: 'Regiões',
        icon: 'MapPin',
        items: [
          { id: 'states', label: 'Estados', href: '/admin/logistics/regions/states', icon: 'Navigation' },
          { id: 'cities', label: 'Cidades', href: '/admin/logistics/regions/cities', icon: 'Building2' },
          { id: 'test-coverage', label: 'Testar Cobertura', href: '/admin/logistics/regions/test', icon: 'MapPin' },
        ],
      },
      { id: 'methods', label: 'Entregas | Frete', href: '/admin/logistics/methods', icon: 'Truck' },
      { id: 'suppliers', label: 'Fornecedores', href: '/admin/logistics/suppliers', icon: 'Store' },
    ],
  },
  
  // Item solto: Pedidos
  {
    id: 'orders',
    type: 'item' as const,
    label: 'Pedidos',
    href: '/admin/orders',
    icon: 'ShoppingCart',
  },
  
  // Item solto: Clientes
  {
    id: 'customers',
    type: 'item' as const,
    label: 'Clientes',
    href: '/admin/customers',
    icon: 'Users',
  },
];

export function AdminSidebar() {
  // Hook que controla estado (aberto/fechado, expandido/recolhido)
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    toggleGroup,
    openMobile,
    closeMobile,
    isGroupExpanded,
  } = useSidebar([]); // Começa com Catálogo expandido
  
  const pathname = usePathname();

  /**
   * Verifica se um link está ativo
   */
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  /**
   * Renderiza um item simples de menu
   */
  const renderItem = (item: any, level: number = 0) => {
    const Icon = iconMap[item.icon];
    const active = isActive(item.href);
    
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={closeMobile}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
          ${isCollapsed && level === 0 ? 'justify-center' : ''}
          ${level > 0 ? 'ml-4 text-sm' : ''}
          ${active 
            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600' 
            : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-gray-300'
          }
        `}
        title={isCollapsed && level === 0 ? item.label : ''}
      >
        {Icon && <Icon size={20} className={`shrink-0 ${active ? 'text-blue-600' : 'text-gray-500'}`} />}
        {(!isCollapsed || level > 0) && (
          <span className="font-medium truncate">{item.label}</span>
        )}
      </Link>
    );
  };

  /**
   * Renderiza um grupo expansível
   */
  const renderGroup = (group: any, level: number = 0) => {
    const Icon = iconMap[group.icon];
    const expanded = isGroupExpanded(group.id);
    const hasActiveChild = group.items.some((child: any) => 
      child.href ? isActive(child.href) : child.items?.some((sub: any) => isActive(sub.href))
    );
    
    return (
      <div key={group.id} className={level > 0 ? 'ml-2' : ''}>
        {/* Cabeçalho do grupo */}
        <button
          onClick={() => toggleGroup(group.id)}
          className={`
            w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
            transition-all duration-200 text-gray-600 hover:bg-gray-50
            ${hasActiveChild ? 'bg-blue-50/50 text-blue-600' : ''}
            ${isCollapsed && level === 0 ? 'justify-center' : ''}
          `}
          title={isCollapsed && level === 0 ? group.label : ''}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon size={20} className={`shrink-0 ${hasActiveChild ? 'text-blue-600' : 'text-gray-500'}`} />}
            {(!isCollapsed || level > 0) && (
              <span className="font-medium truncate">{group.label}</span>
            )}
          </div>
          {(!isCollapsed || level > 0) && (
            expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </button>
        
        {/* Itens do grupo */}
        {expanded && (
          <div className="mt-1 space-y-1">
            {group.items.map((child: any) => 
              child.type === 'subgroup' 
                ? renderGroup(child, level + 1)
                : renderItem(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Botão hamburger MOBILE */}
      {!isMobileOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={openMobile}
          className="lg:hidden fixed top-4 left-3 z-50 h-9 w-10 shadow-md"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Overlay mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        bg-white border-r border-gray-200 min-h-screen transition-all duration-300
        fixed lg:relative z-40
        ${isMobileOpen ? "left-0" : "-left-full lg:left-0"}
        ${isCollapsed ? "w-16" : "w-64"}
      `}>
        {/* Cabeçalho */}
        <div className={`
          p-4 border-b border-gray-200 flex items-center h-16
          ${isCollapsed ? "justify-center" : "justify-between"}
        `}>
          {!isCollapsed && <h1 className="text-xl font-bold text-gray-800 truncate">Admin</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {menuData.map((item) => 
            item.type === 'item' ? renderItem(item) : renderGroup(item)
          )}
        </nav>
      </aside>
    </>
  );
}