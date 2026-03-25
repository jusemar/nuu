'use client';

import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Bell,
  HelpCircle,
  Zap,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { useHeader } from '../hooks/useHeader';
import { useState } from 'react';
import { NavigationDrawer } from '../../store/menu/components/NavigationDrawer';

// ─── Design system tokens (espelham o globals.css) ───────────────────────────
const DS = {
  primary:      '#0C447C',
  primaryHover: '#1E3A8A',
  primaryLight: '#EFF6FF',
  accent:       '#EF9F27',
  success:      '#14B8A6',
  text:         '#1F2937',
  muted:        '#6B7280',
  border:       '#E5E7EB',
  bg:           '#F8F8F6',
  danger:       '#DC2626',
};

export interface HeaderProps {}

export const Header = ({}: HeaderProps) => {
  const { isMobile } = useHeader();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white" style={{ borderBottom: `1px solid ${DS.border}` }}>

      {/* ── Barra principal ── */}
      <div style={{ borderBottom: `1px solid ${DS.border}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Botão menu mobile */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg transition flex-shrink-0"
              style={{ color: DS.muted }}
              onMouseEnter={e => (e.currentTarget.style.background = DS.primaryLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-85 transition-opacity">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ background: DS.primary }}
              >
                <span className="text-white font-bold text-sm tracking-tight select-none">DR</span>
              </div>
              <div className="hidden md:block leading-tight">
                <span className="block font-bold text-[17px] leading-none" style={{ color: DS.text }}>
                  Do Rocha
                </span>
                <span className="block text-[11px]" style={{ color: DS.muted }}>
                  Sua loja
                </span>
              </div>
            </Link>

            {/* Busca */}
            <div className="flex-grow max-w-xl">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: DS.muted }}
                />
                <input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition"
                  style={{
                    background: DS.bg,
                    border: `1.5px solid ${DS.border}`,
                    color: DS.text,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = `1.5px solid ${DS.primary}`;
                    e.currentTarget.style.background = '#fff';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = `1.5px solid ${DS.border}`;
                    e.currentTarget.style.background = DS.bg;
                  }}
                />
              </div>
            </div>

            {/* Ações direita */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">

              {/* Notificações */}
              <button
                className="p-2 rounded-lg transition relative hidden sm:flex items-center justify-center"
                style={{ color: DS.muted }}
                onMouseEnter={e => (e.currentTarget.style.background = DS.primaryLight)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Notificações"
              >
                <Bell size={19} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: DS.danger }}
                />
              </button>

              {/* Ajuda */}
              <button
                className="p-2 rounded-lg transition hidden sm:flex items-center justify-center"
                style={{ color: DS.muted }}
                onMouseEnter={e => (e.currentTarget.style.background = DS.primaryLight)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Ajuda"
              >
                <HelpCircle size={19} />
              </button>

              {/* Carrinho */}
              <button
                className="p-2 rounded-lg transition relative flex items-center justify-center"
                style={{ color: DS.muted }}
                onMouseEnter={e => (e.currentTarget.style.background = DS.primaryLight)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Carrinho"
              >
                <ShoppingCart size={19} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: DS.danger }}
                >
                  
                </span>
              </button>

              {/* Conta — desktop */}
              <button
                className="p-2 rounded-lg transition hidden md:flex items-center justify-center"
                style={{ color: DS.muted }}
                onMouseEnter={e => (e.currentTarget.style.background = DS.primaryLight)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Minha conta"
              >
                <User size={19} />
              </button>

              {/* Conta — mobile */}
              <Link
                href="/login"
                className="md:hidden p-2 rounded-lg transition flex items-center justify-center"
                style={{ color: DS.muted }}
              >
                <User size={19} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegação desktop ── */}
      {!isMobile && (
        <nav
          className="hidden md:block"
          style={{ background: DS.primaryLight, borderBottom: `1px solid ${DS.border}` }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 py-2 text-sm font-medium overflow-x-auto scrollbar-none">

              {/* Categorias */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition whitespace-nowrap"
                style={{ color: DS.primary }}
                onMouseEnter={e => (e.currentTarget.style.background = '#DBEAFE')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="Abrir categorias"
              >
                <Menu className="w-4 h-4" />
                <span className="font-semibold">Categorias</span>
              </button>

              <span style={{ color: DS.border }} className="select-none">|</span>

              {/* Ofertas do Dia — âmbar */}
              <Link
                href="/ofertas-do-dia"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition whitespace-nowrap"
                style={{ color: DS.text }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.text)}
              >
                <Zap className="w-4 h-4" style={{ color: DS.accent }} />
                Ofertas do Dia
              </Link>

              {/* Mais Vendidos — teal */}
              <Link
                href="/mais-vendidos"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition whitespace-nowrap"
                style={{ color: DS.text }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.text)}
              >
                <TrendingUp className="w-4 h-4" style={{ color: DS.success }} />
                Mais Vendidos
              </Link>

              {/* Lançamentos */}
              <Link
                href="/lancamentos"
                className="px-3 py-1.5 rounded-md transition whitespace-nowrap"
                style={{ color: DS.text }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.text)}
              >
                Lançamentos
              </Link>

              {/* Marcas */}
              <Link
                href="/marcas"
                className="px-3 py-1.5 rounded-md transition whitespace-nowrap"
                style={{ color: DS.text }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.text)}
              >
                Marcas
              </Link>

              {/* Black Friday — destaque especial */}
              <Link
                href="/black-friday"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ml-auto"
                style={{ color: DS.danger }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Tag className="w-4 h-4" />
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