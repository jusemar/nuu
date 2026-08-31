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

import {
  Banknote,
  Bot,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  DollarSign,
  Files,
  FileSpreadsheet,
  FolderIcon,
  Image,
  LayoutDashboard,
  MapPin,
  Medal,
  Megaphone,
  MoreHorizontal,
  Navigation,
  Package,
  PackageCheck,
  Percent,
  Plug,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PermissaoAdministrativaChave } from "@/features/autenticacao/constants/permissoes-administrativas";

import { useSidebar } from "../hooks/useSidebar";

/**
 * Mapeamento de nomes de ícones para componentes do Lucide
 */
const iconMap: Record<string, React.ElementType> = {
  Banknote,
  LayoutDashboard,
  Package,
  FolderIcon,
  ShoppingCart,
  Users,
  Truck,
  MapPin,
  Store,
  Building2,
  Bot,
  Navigation,
  DollarSign,
  PackageCheck,
  Percent,
  Settings,
  Image,
  Tag,
  TicketPercent,
  Megaphone,
  Medal,
  ShieldCheck,
  FileSpreadsheet,
  Files,
  Plug,
};

type ItemMenuAdmin = {
  id: string;
  type?: "item";
  label: string;
  href: string;
  icon: string;
  /**
   * Item que faz parte da organização prevista do menu, mas ainda não tem tela.
   *
   * Aparece esmaecido e sem link, com a etiqueta "Em breve". É a diferença
   * entre mostrar o roteiro do produto e entregar um link que devolve 404 —
   * o segundo destrói a confiança do gestor na navegação.
   */
  emBreve?: boolean;
};

type GrupoMenuAdmin = {
  id: string;
  type: "group" | "subgroup";
  label: string;
  icon: string;
  items: EntradaMenuAdmin[];
};

type EntradaMenuAdmin = ItemMenuAdmin | GrupoMenuAdmin;

/**
 * Dados do menu - estrutura hierárquica completa
 */
export const menuAdmin: EntradaMenuAdmin[] = [
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
        id: "products-bulk-edit",
        label: "Alteração em massa",
        href: "/admin/products/alteracao-em-massa",
        icon: "PackageCheck",
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
        id: "pagamento-na-entrega-logistica",
        label: "Pagamento na Entrega",
        href: "/admin/logistica/pagamento-na-entrega",
        icon: "Banknote",
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

  // Grupo: Fornecedores — o cadastro e o catálogo de quem fornece.
  {
    id: "fornecedores",
    type: "group" as const,
    label: "Fornecedores",
    icon: "Building2",
    items: [
      {
        id: "fornecedores-visao-geral",
        label: "Visão geral",
        href: "/admin/fornecedores",
        icon: "Building2",
      },
      {
        id: "fornecedores-catalogos",
        label: "Catálogos de fornecedores",
        href: "/admin/fornecedores",
        icon: "FileSpreadsheet",
        emBreve: true,
      },
      {
        id: "fornecedores-produtos",
        label: "Produtos de fornecedores",
        href: "/admin/fornecedores",
        icon: "Package",
        emBreve: true,
      },
      {
        id: "fornecedores-configuracoes",
        label: "Configurações",
        href: "/admin/fornecedores",
        icon: "ShieldCheck",
        emBreve: true,
      },
    ],
  },

  // Grupo: Importações — a entrada por ARQUIVO. A entrada por API vive em
  // Integrações, mas as duas desembocam no mesmo processamento.
  {
    id: "importacoes",
    type: "group" as const,
    label: "Importações",
    icon: "FileSpreadsheet",
    items: [
      {
        id: "importacoes-arquivo-excel",
        label: "Arquivo Excel",
        href: "/admin/fornecedores/importacoes",
        icon: "FileSpreadsheet",
      },
      {
        id: "importacoes-historico",
        label: "Histórico",
        href: "/admin/fornecedores/importacoes",
        icon: "RefreshCw",
        emBreve: true,
      },
    ],
  },

  // Grupo: Integrações — origens externas de dados.
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
      {
        id: "integracoes-marketplaces",
        type: "subgroup" as const,
        label: "Marketplaces",
        icon: "ShoppingCart",
        items: [
          {
            id: "integracoes-marketplaces-mercado-livre",
            label: "Mercado Livre",
            href: "/admin",
            icon: "ShoppingCart",
            emBreve: true,
          },
          {
            id: "integracoes-marketplaces-shopee",
            label: "Shopee",
            href: "/admin",
            icon: "ShoppingCart",
            emBreve: true,
          },
          {
            id: "integracoes-marketplaces-amazon",
            label: "Amazon",
            href: "/admin",
            icon: "ShoppingCart",
            emBreve: true,
          },
        ],
      },
      {
        id: "integracoes-canais-venda",
        type: "subgroup" as const,
        label: "Canais de venda",
        icon: "Megaphone",
        items: [
          {
            id: "integracoes-canais-google-shopping",
            label: "Google Shopping",
            href: "/admin",
            icon: "Megaphone",
            emBreve: true,
          },
          {
            id: "integracoes-canais-meta",
            label: "Meta",
            href: "/admin",
            icon: "Megaphone",
            emBreve: true,
          },
          {
            id: "integracoes-canais-whatsapp",
            label: "WhatsApp",
            href: "/admin",
            icon: "Megaphone",
            emBreve: true,
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

  // O módulo mantém uma única entrada; a navegação interna organiza as áreas.
  {
    id: "atendente-ia",
    type: "group" as const,
    label: "Atendente IA",
    icon: "Bot",
    items: [
      {
        id: "treinamento-atendente-ia",
        label: "Treinamento da IA",
        href: "/admin/atendente-ia/treinamento",
        icon: "Bot",
      },
    ],
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
        id: "programa-fidelidade",
        label: "Programa de Fidelidade",
        href: "/admin/marketing/programa-fidelidade",
        icon: "Medal",
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
        id: "dados-loja",
        label: "Dados e logos da loja",
        href: "/admin/configuracoes/loja",
        icon: "Store",
      },
      {
        id: "banners-home",
        label: "Banners da Home",
        href: "/admin/configuracoes/banners-home",
        icon: "Image",
      },
      {
        id: "paginas-da-loja",
        label: "Páginas da loja",
        href: "/admin/configuracoes/paginas-da-loja",
        icon: "Files",
      },
      {
        id: "usuarios-e-permissoes",
        label: "Usuários e permissões",
        href: "/admin/configuracoes/usuarios-e-permissoes",
        icon: "Users",
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

const permissaoPorItem: Partial<Record<string, PermissaoAdministrativaChave>> =
  {
    dashboard: "painel.visualizar",
    products: "produtos.visualizar",
    "products-bulk-edit": "produtos.publicar",
    categories: "categorias.visualizar",
    marcas: "marcas.administrar",
    precificacao: "precificacao.administrar",
    "visao-geral-logistica": "logistica.visualizar",
    "integracoes-logistica": "logistica.visualizar",
    "servicos-entrega-logistica": "logistica.visualizar",
    "regras-disponibilidade-logistica": "logistica.visualizar",
    "pagamento-na-entrega-logistica": "pagamentos_entrega.administrar",
    "retirada-local": "logistica.visualizar",
    shipping: "logistica.visualizar",
    "fornecedores-visao-geral": "fornecedores.visualizar",
    "fornecedores-catalogos": "fornecedores.visualizar",
    "fornecedores-produtos": "fornecedores.visualizar",
    "fornecedores-configuracoes": "fornecedores.administrar",
    "importacoes-arquivo-excel": "fornecedores.importar",
    "importacoes-historico": "fornecedores.visualizar",
    "integracoes-fornecedores-api-laquila": "fornecedores.visualizar",
    orders: "pedidos.visualizar",
    "treinamento-atendente-ia": "atendente_ia.acessar",
    promocoes: "marketing.administrar",
    "cupons-promocao": "marketing.administrar",
    "programa-fidelidade": "fidelidade.administrar",
    "auditoria-cupons": "marketing.auditoria",
    "auditoria-frete-gratis": "marketing.auditoria",
    "dados-loja": "loja_configuracoes.administrar",
    "banners-home": "banners.administrar",
    "paginas-da-loja": "paginas.administrar",
    "usuarios-e-permissoes": "administradores.visualizar",
  };

export function filtrarMenuAdmin(
  entradas: EntradaMenuAdmin[],
  permissoes: ReadonlySet<string>,
): EntradaMenuAdmin[] {
  return entradas.reduce<EntradaMenuAdmin[]>((filtradas, entrada) => {
    if ("href" in entrada) {
      const permissao = permissaoPorItem[entrada.id];
      if (!permissao || permissoes.has(permissao)) filtradas.push(entrada);
      return filtradas;
    }
    const items = filtrarMenuAdmin(entrada.items, permissoes);
    if (items.length) filtradas.push({ ...entrada, items });
    return filtradas;
  }, []);
}

export function AdminSidebar({ permissoes }: { permissoes: string[] }) {
  const menuPermitido = filtrarMenuAdmin(menuAdmin, new Set(permissoes));
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
    if (href === "/admin/products") {
      return (
        pathname.startsWith(href) &&
        !pathname.startsWith("/admin/products/alteracao-em-massa")
      );
    }
    return pathname.startsWith(href);
  };

  /**
   * Renderiza um item simples de menu
   */
  const renderItem = (item: ItemMenuAdmin, level: number = 0) => {
    const Icon = iconMap[item.icon];
    const active = isActive(item.href);

    // Sem tela ainda: mostra o item no lugar certo da hierarquia, mas não
    // navega. Melhor um "Em breve" honesto do que um clique que quebra.
    if (item.emBreve) {
      return (
        <div
          key={item.id}
          aria-disabled="true"
          className={`text-muted-foreground/50 flex min-h-10 cursor-default items-center gap-3 rounded-lg px-3 py-2 ${
            isCollapsed && level === 0 ? "justify-center" : ""
          } ${level > 0 ? "ml-4 text-sm" : ""}`}
          title={
            isCollapsed && level === 0
              ? `${item.label} (em breve)`
              : "Ainda não disponível"
          }
        >
          {Icon && <Icon size={18} className="shrink-0" />}
          {(!isCollapsed || level > 0) && (
            <>
              <span className="truncate font-medium">{item.label}</span>
              <span className="border-border text-muted-foreground/70 ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium">
                Em breve
              </span>
            </>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={closeMobile}
        aria-current={active ? "page" : undefined}
        className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${isCollapsed && level === 0 ? "justify-center" : ""} ${level > 0 ? "ml-4 text-sm" : ""} ${
          active
            ? "bg-sidebar-accent text-sidebar-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--sidebar-primary)_10%,transparent)]"
            : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
        } `}
        title={isCollapsed && level === 0 ? item.label : ""}
      >
        {active && !isCollapsed && level === 0 && (
          <span className="bg-sidebar-primary absolute inset-y-2 left-0 w-0.5 rounded-full" />
        )}
        {Icon && (
          <Icon
            size={18}
            className="shrink-0 transition-transform group-hover:scale-105"
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
  const renderGroup = (group: GrupoMenuAdmin, level: number = 0) => {
    const Icon = iconMap[group.icon];
    const expanded = isGroupExpanded(group.id);
    const hasActiveChild = group.items.some((child) =>
      "href" in child
        ? isActive(child.href)
        : child.items.some((sub) => "href" in sub && isActive(sub.href)),
    );

    return (
      <div key={group.id} className={level > 0 ? "ml-2" : ""}>
        {/* Cabeçalho do grupo */}
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          aria-expanded={expanded}
          className={`focus-visible:ring-ring flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none ${hasActiveChild ? "bg-sidebar-accent text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"} ${isCollapsed && level === 0 ? "justify-center" : ""} `}
          title={isCollapsed && level === 0 ? group.label : ""}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon size={18} className="shrink-0" />}
            {(!isCollapsed || level > 0) && (
              <span className="truncate font-medium">{group.label}</span>
            )}
          </div>
          {(!isCollapsed || level > 0) &&
            (expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </button>

        {/* Itens do grupo */}
        {expanded && (!isCollapsed || level > 0) && (
          <div className="mt-1 space-y-1">
            {group.items.map((child) =>
              "href" in child
                ? renderItem(child, level + 1)
                : renderGroup(child, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* A sidebar completa permanece disponível no desktop. */}
      <aside
        className={`bg-sidebar/95 text-sidebar-foreground border-sidebar-border/80 sticky top-0 hidden h-dvh shrink-0 border-r backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* Cabeçalho */}
        <div
          className={`border-sidebar-border/70 flex h-16 shrink-0 items-center border-b px-3 ${isCollapsed ? "justify-center" : "justify-between"} `}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <span className="gradient-primary flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm">
                D
              </span>
              <div>
                <h1 className="text-foreground truncate text-sm font-semibold">
                  Nooo
                </h1>
                <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  Admin
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="text-muted-foreground h-9 w-9 shrink-0"
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
        <nav
          aria-label="Navegação principal"
          className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto p-3"
        >
          {menuPermitido.map((item) =>
            "href" in item ? renderItem(item) : renderGroup(item),
          )}
        </nav>
      </aside>

      {/* No celular, o item Mais abre a árvore completa em um drawer acessível. */}
      <Sheet
        open={isMobileOpen}
        onOpenChange={(aberto) => (aberto ? openMobile() : closeMobile())}
      >
        <SheetContent
          side="left"
          className="w-[min(78vw,18rem)] gap-0 p-0 lg:hidden"
        >
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>Menu administrativo</SheetTitle>
            <SheetDescription>
              Acesse todos os módulos da loja.
            </SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Todos os módulos"
            className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {menuPermitido.map((item) =>
              "href" in item ? renderItem(item) : renderGroup(item),
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <nav
        aria-label="Navegação rápida"
        className="bg-background/95 fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {menuPermitido
          .flatMap((entrada) => ("href" in entrada ? [entrada] : entrada.items))
          .filter(
            (entrada): entrada is ItemMenuAdmin =>
              "href" in entrada &&
              ["dashboard", "orders", "products"].includes(entrada.id),
          )
          .map((item) => {
            const ativo = isActive(item.href);
            const Icone = iconMap[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`focus-visible:ring-ring flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none ${ativo ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icone className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        <button
          type="button"
          onClick={openMobile}
          aria-expanded={isMobileOpen}
          className="text-muted-foreground focus-visible:ring-ring flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
          Mais
        </button>
      </nav>
    </>
  );
}
