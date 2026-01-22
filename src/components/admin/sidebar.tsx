// src/components/admin/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  FolderIcon,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Produtos" },
  { href: "/admin/categories", icon: FolderIcon, label: "Categorias" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Pedidos" },
  { href: "/admin/customers", icon: Users, label: "Clientes" },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const toggleDesktopSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Fechar menu mobile ao clicar em um link
  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Botão hamburger para MOBILE (visível apenas em telas pequenas) */}
      {!isMobileOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileSidebar}
          className="lg:hidden fixed top-4 left-3 z-50 h-9 w-10 shadow-md"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Overlay para mobile (quando menu aberto) */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar para DESKTOP e MOBILE */}
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
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 truncate">Admin</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDesktopSidebar}
            className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Menu de navegação */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`
                  flex items-center rounded-lg transition-all duration-200
                  ${isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"}
                  ${isActive 
                    ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600" 
                    : "text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-gray-300"
                  }
                `}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon 
                  size={20} 
                  className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`}
                />
                {!isCollapsed && (
                  <span className="font-medium text-gray-700 truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Status do menu (apenas visual - desktop) */}
        <div className={`
          absolute bottom-4 left-0 right-0 px-3 text-xs hidden lg:block
          ${isCollapsed ? "text-center" : "px-4"}
        `}>
          <div className="text-gray-400 truncate">
            {isCollapsed ? "..." : "Menu recolhível"}
          </div>
        </div>
      </aside>
    </>
  );
};