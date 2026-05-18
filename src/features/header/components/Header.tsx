"use client";

import Link from "next/link";
import {
  Bell,
  HelpCircle,
  Menu,
  Search,
  TrendingUp,
  Zap,
  Tag,
} from "lucide-react";
import { useHeader } from "../hooks/useHeader";
import { useState } from "react";
import { NavigationDrawer } from "../../store/menu/components/NavigationDrawer";
import { GavetaCarrinho } from "@/features/carrinho";
import { BotaoContaCliente } from "@/features/autenticacao";

// ─── Design system tokens (espelham o globals.css) ───────────────────────────
const DS = {
  primary: "#0C447C",
  primaryHover: "#1E3A8A",
  primaryLight: "#EFF6FF",
  accent: "#EF9F27",
  success: "#14B8A6",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  bg: "#F8F8F6",
  danger: "#DC2626",
};

export interface HeaderProps {}

export const Header = ({}: HeaderProps) => {
  const { isMobile } = useHeader();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white"
      style={{ borderBottom: `1px solid ${DS.border}` }}
    >
      {/* ── Barra principal ── */}
      <div style={{ borderBottom: `1px solid ${DS.border}` }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Botão menu mobile */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-shrink-0 rounded-lg p-2 transition md:hidden"
              style={{ color: DS.muted }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = DS.primaryLight)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex flex-shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg shadow-sm"
                style={{ background: DS.primary }}
              >
                <span className="text-sm font-bold tracking-tight text-white select-none">
                  DR
                </span>
              </div>
              <div className="hidden leading-tight md:block">
                <span
                  className="block text-[17px] leading-none font-bold"
                  style={{ color: DS.text }}
                >
                  Do Rocha
                </span>
                <span className="block text-[11px]" style={{ color: DS.muted }}>
                  Sua loja
                </span>
              </div>
            </Link>

            {/* Busca */}
            <div className="max-w-xl flex-grow">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  style={{ color: DS.muted }}
                />
                <input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="w-full rounded-lg py-2.5 pr-4 pl-10 text-sm transition outline-none"
                  style={{
                    background: DS.bg,
                    border: `1.5px solid ${DS.border}`,
                    color: DS.text,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1.5px solid ${DS.primary}`;
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1.5px solid ${DS.border}`;
                    e.currentTarget.style.background = DS.bg;
                  }}
                />
              </div>
            </div>

            {/* Ações direita */}
            <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
              {/* Notificações */}
              <button
                className="relative hidden items-center justify-center rounded-lg p-2 transition sm:flex"
                style={{ color: DS.muted }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = DS.primaryLight)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                aria-label="Notificações"
              >
                <Bell size={19} />
                <span
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                  style={{ background: DS.danger }}
                />
              </button>

              {/* Ajuda */}
              <button
                className="hidden items-center justify-center rounded-lg p-2 transition sm:flex"
                style={{ color: DS.muted }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = DS.primaryLight)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                aria-label="Ajuda"
              >
                <HelpCircle size={19} />
              </button>

              {/* Carrinho */}
              <GavetaCarrinho />

              <BotaoContaCliente />
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegação desktop ── */}
      {!isMobile && (
        <nav
          className="hidden md:block"
          style={{
            background: DS.primaryLight,
            borderBottom: `1px solid ${DS.border}`,
          }}
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="scrollbar-none flex items-center gap-1 overflow-x-auto py-2 text-sm font-medium">
              {/* Categorias */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition"
                style={{ color: DS.primary }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#DBEAFE")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                aria-label="Abrir categorias"
              >
                <Menu className="h-4 w-4" />
                <span className="font-semibold">Categorias</span>
              </button>

              <span style={{ color: DS.border }} className="select-none">
                |
              </span>

              {/* Ofertas do Dia — âmbar */}
              <Link
                href="/ofertas-do-dia"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition"
                style={{ color: DS.text }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = DS.text)}
              >
                <Zap className="h-4 w-4" style={{ color: DS.accent }} />
                Ofertas do Dia
              </Link>

              {/* Mais Vendidos — teal */}
              <Link
                href="/mais-vendidos"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap transition"
                style={{ color: DS.text }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = DS.text)}
              >
                <TrendingUp className="h-4 w-4" style={{ color: DS.success }} />
                Mais Vendidos
              </Link>

              {/* Lançamentos */}
              <Link
                href="/lancamentos"
                className="rounded-md px-3 py-1.5 whitespace-nowrap transition"
                style={{ color: DS.text }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = DS.text)}
              >
                Lançamentos
              </Link>

              {/* Marcas */}
              <Link
                href="/marcas"
                className="rounded-md px-3 py-1.5 whitespace-nowrap transition"
                style={{ color: DS.text }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = DS.text)}
              >
                Marcas
              </Link>

              {/* Black Friday — destaque especial */}
              <Link
                href="/black-friday"
                className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold whitespace-nowrap transition"
                style={{ color: DS.danger }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Tag className="h-4 w-4" />
                Black Friday
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Navigation Drawer — funciona em todas as telas, não alterado */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </header>
  );
};
