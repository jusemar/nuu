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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  DollarSign,
  PackageCheck,
  Percent,
  Settings,
  Image,
  Tag,
  TicketPercent,
  Megaphone,
  ShieldCheck,
  FileSpreadsheet,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "../hooks/useSidebar";

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
  DollarSign,
  PackageCheck,
  Percent,
  Settings,
  Image,
  Tag,
  TicketPercent,
  Megaphone,
  ShieldCheck,
  FileSpreadsheet,
  Plug,
};

/**
 * Dados do menu - estrutura hierárquica completa
 */
export const menuAdmin = [
  // Item solto: Dashboard
  {
    id: "dashboard",
    type: "item" as const,
    label: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard",
  },

  // Grupo: Catálogo
  {
    id: "catalog",
    type: "group" as const,
    label: "Catálogo",
    icon: "Package",
    items: [
      {
        id: "products",
        label: "Produtos",
        href: "/admin/products",
        icon: "Package",
      },
      {
        id: "categories",
        label: "Categorias",
        href: "/admin/categories",
        icon: "FolderIcon",
      },
      {
        id: "marcas",
        label: "Marcas",
        href: "/admin/marcas",
        icon: "Tag",
      },
      {
        id: "precificacao",
        label: "Precificação",
        href: "/admin/precificacao",
        icon: "Percent",
      },
    ],
  },

  // Grupo: Logística
  {
    id: "logistics",
    type: "group" as const,
    label: "Logística",
    icon: "Truck",
    items: [
      {
        id: "visao-geral-logistica",
        label: "Visão Geral",
        href: "/admin/logistica/visao-geral",
        icon: "LayoutDashboard",
      },
      {
        id: "integracoes-logistica",
        label: "Integrações",
        href: "/admin/logistica/integracoes",
        icon: "Truck",
      },
      {
        id: "servicos-entrega-logistica",
        label: "Serviços de Entrega",
        href: "/admin/logistica/servicos-entrega",
        icon: "PackageCheck",
      },
      {
        id: "regras-disponibilidade-logistica",
        label: "Regras de Disponibilidade",
        href: "/admin/logistica/regras-disponibilidade",
        icon: "Navigation",
      },
      {
        id: "retirada-local",
        type: "item" as const,
        label: "Retirada",
        href: "/admin/logistica/retirada-local",
        icon: "Store",
      },
      {
        id: "shipping",
        type: "item" as const,
        label: "Entrega Própria",
        href: "/admin/logistics/entrega-propria",
        icon: "PackageCheck",
      },
    ],
  },

  // Grupo: Fornecedores
  {
    id: "fornecedores",
    type: "group" as const,
    label: "Fornecedores",
    icon: "Building2",
    items: [
      {
        id: "fornecedores-cadastro",
        label: "Fornecedores",
        href: "/admin/fornecedores",
        icon: "Building2",
      },
      {
        id: "fornecedores-importacoes",
        label: "Importações",
        href: "/admin/fornecedores/importacoes",
        icon: "FileSpreadsheet",
      },
    ],
  },

  // Grupo: Integrações
  {
    id: "integracoes",
    type: "group" as const,
    label: "Integrações",
    icon: "Plug",
    items: [
      {
        id: "integracoes-fornecedores-api",
        type: "subgroup" as const,
        label: "Fornecedores API",
        icon: "Building2",
        items: [
          {
            id: "integracoes-fornecedores-api-laquila",
            label: "Laquila",
            href: "/admin/fornecedores/integracoes/laquila",
            icon: "Plug",
          },
        ],
      },
    ],
  },

  // Item solto: Pedidos
  {
    id: "orders",
    type: "item" as const,
    label: "Pedidos",
    href: "/admin/orders",
    icon: "ShoppingCart",
  },

  // Grupo: Marketing
  {
    id: "marketing",
    type: "group" as const,
    label: "Marketing",
    icon: "Megaphone",
    items: [
      {
        id: "promocoes",
        label: "Promoções",
        href: "/admin/marketing/promocoes",
        icon: "Percent",
      },
      {
        id: "cupons-promocao",
        label: "Cupons",
        href: "/admin/marketing/cupons",
        icon: "TicketPercent",
      },
      {
        id: "auditoria-cupons",
        label: "Auditoria Cupons",
        href: "/admin/marketing/auditoria-cupons",
        icon: "ShieldCheck",
      },
      {
        id: "auditoria-frete-gratis",
        label: "Auditoria Frete Grátis",
        href: "/admin/marketing/auditoria-frete-gratis",
        icon: "Truck",
      },
    ],
  },

  // Grupo: Configurações
  {
    id: "configuracoes",
    type: "group" as const,
    label: "Configurações",
    icon: "Settings",
    items: [
      {
        id: "banners-home",
        label: "Banners da Home",
        href: "/admin/configuracoes/banners-home",
        icon: "Image",
      },
    ],
  },

  // Item solto: Clientes
  {
    id: "customers",
    type: "item" as const,
    label: "Clientes",
    href: "/admin/customers",
    icon: "Users",
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
    if (href === "/admin") return pathname === "/admin";
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
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${isCollapsed && level === 0 ? "justify-center" : ""} ${level > 0 ? "ml-4 text-sm" : ""} ${
          active
            ? "border-l-2 border-blue-600 bg-blue-50 text-blue-600"
            : "border-l-2 border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        } `}
        title={isCollapsed && level === 0 ? item.label : ""}
      >
        {Icon && (
          <Icon
            size={20}
            className={`shrink-0 ${active ? "text-blue-600" : "text-gray-500"}`}
          />
        )}
        {(!isCollapsed || level > 0) && (
          <span className="truncate font-medium">{item.label}</span>
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
      child.href
        ? isActive(child.href)
        : child.items?.some((sub: any) => isActive(sub.href)),
    );

    return (
      <div key={group.id} className={level > 0 ? "ml-2" : ""}>
        {/* Cabeçalho do grupo */}
        <button
          onClick={() => toggleGroup(group.id)}
          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-all duration-200 hover:bg-gray-50 ${hasActiveChild ? "bg-blue-50/50 text-blue-600" : ""} ${isCollapsed && level === 0 ? "justify-center" : ""} `}
          title={isCollapsed && level === 0 ? group.label : ""}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon
                size={20}
                className={`shrink-0 ${hasActiveChild ? "text-blue-600" : "text-gray-500"}`}
              />
            )}
            {(!isCollapsed || level > 0) && (
              <span className="truncate font-medium">{group.label}</span>
            )}
          </div>
          {(!isCollapsed || level > 0) &&
            (expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </button>

        {/* Itens do grupo */}
        {expanded && (
          <div className="mt-1 space-y-1">
            {group.items.map((child: any) =>
              child.type === "subgroup"
                ? renderGroup(child, level + 1)
                : renderItem(child, level + 1),
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
          className="fixed top-4 left-3 z-50 h-9 w-10 shadow-md lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed z-40 min-h-screen border-r border-gray-200 bg-white transition-all duration-300 lg:relative ${isMobileOpen ? "left-0" : "-left-full lg:left-0"} ${isCollapsed ? "w-16" : "w-64"} `}
      >
        {/* Cabeçalho */}
        <div
          className={`flex h-16 items-center border-b border-gray-200 p-4 ${isCollapsed ? "justify-center" : "justify-between"} `}
        >
          {!isCollapsed && (
            <h1 className="truncate text-xl font-bold text-gray-800">Admin</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8 shrink-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Menu */}
        <nav className="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {menuAdmin.map((item) =>
            item.type === "item" ? renderItem(item) : renderGroup(item),
          )}
        </nav>
      </aside>
    </>
  );
}
