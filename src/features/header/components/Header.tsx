'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, Menu, Bell, HelpCircle, X, Zap, TrendingUp, Tag } from 'lucide-react';
import { useHeader } from '../hooks/useHeader';
import { useState } from 'react';
import { NavigationDrawer } from './NavigationDrawer';

export interface HeaderProps {
  // Props podem ser adicionadas depois
}

export const Header = ({}: HeaderProps) => {
  const { isMobile } = useHeader();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white">    

      {/* Main Header */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Mobile Menu Button - ABRE DRAWER */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              aria-label="Menu"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">DR</span>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-lg text-gray-900 leading-tight">Do Rocha</h1>
                <p className="text-xs text-gray-500">Sua loja</p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-grow max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* Notification */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition relative hidden sm:block" aria-label="Notificações">
                <Bell size={20} className="text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Help */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition hidden sm:block" aria-label="Ajuda">
                <HelpCircle size={20} className="text-gray-700" />
              </button>

              {/* Cart */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition relative" aria-label="Carrinho">
                <ShoppingCart size={20} className="text-gray-700" />
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">0</span>
              </button>

              {/* User */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition hidden md:block" aria-label="Conta">
                <User size={20} className="text-gray-700" />
              </button>

              {/* Mobile User */}
              <Link href="/login" className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition">
                <User size={20} className="text-gray-700" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation - CORRIGIDO */}
      {!isMobile && (
        <nav className="border-t border-slate-100 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6 py-3 text-sm font-medium">
              {/* Botão Hamburger para Categorias (abre drawer) */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-gray-700 hover:text-teal-600 cursor-pointer transition-colors flex items-center gap-1.5"
                aria-label="Abrir categorias"
              >
                <Menu className="w-4 h-4 text-gray-600" />
                Categorias
              </button>
              
              <Link href="/ofertas-do-dia" className="text-gray-700 hover:text-teal-600 cursor-pointer transition-colors flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Ofertas do Dia
              </Link>
              
              <Link href="/mais-vendidos" className="text-gray-700 hover:text-teal-600 cursor-pointer transition-colors flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                Mais Vendidos
              </Link>
              
              <Link href="/lancamentos" className="text-gray-700 hover:text-teal-600 cursor-pointer transition-colors">
                Lançamentos
              </Link>
              
              <Link href="/marcas" className="text-gray-700 hover:text-teal-600 cursor-pointer transition-colors">
                Marcas
              </Link>
              
              <Link href="/black-friday" className="text-rose-600 font-bold cursor-pointer flex items-center gap-1.5 hover:text-rose-700">
                <Tag className="w-4 h-4 text-rose-600" />
                Black Friday
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Menu (antigo - pode remover se não for usar) */}
      {isMenuOpen && isMobile && (
        <div className="border-t border-gray-200 bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link href="/produtos" className="py-2 text-gray-700 hover:text-blue-600 transition font-medium">
              Produtos
            </Link>
            <Link href="/categorias" className="py-2 text-gray-700 hover:text-blue-600 transition font-medium">
              Categorias
            </Link>
            <Link href="/ofertas" className="py-2 text-gray-700 hover:text-blue-600 transition font-medium">
              Ofertas
            </Link>
            <Link href="/sobre" className="py-2 text-gray-700 hover:text-blue-600 transition font-medium">
              Sobre
            </Link>
            <Link href="/login" className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center mt-2">
              Entrar
            </Link>
          </nav>
        </div>
      )}

      {/* Navigation Drawer - FUNCIONA EM TODAS AS TELAS */}
      <NavigationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </header>
  );
};