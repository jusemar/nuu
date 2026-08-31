"use client";

import { Compass, Menu, Tag, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BotaoContaCliente } from "@/features/autenticacao";
import { GavetaCarrinho } from "@/features/carrinho";
import { LogoDinamica } from "@/features/configuracoes-loja/components/store/logo-dinamica";
import { NavigationDrawer } from "@/features/store/menu/components/NavigationDrawer";

import { CampoBuscaProdutos } from "./CampoBuscaProdutos";

const cores = { destaque: "#EF9F27", sucesso: "#14B8A6" };

export function HeaderInterativo({
  logoCabecalhoUrl,
}: {
  logoCabecalhoUrl: string | null;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
          <div className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-2 py-2 md:flex md:h-16 md:gap-4 md:py-0">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0C447C] focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none md:hidden"
              aria-label="Abrir menu de categorias"
              aria-expanded={menuAberto}
              aria-controls="menu-categorias-loja"
            >
              <Menu className="size-5" />
            </button>
            <LogoDinamica
              local="cabecalho"
              url={logoCabecalhoUrl}
              className="min-w-0 justify-self-start"
            />
            <div className="col-start-3 flex shrink-0 items-center gap-0.5 sm:gap-1 md:order-3 md:gap-2">
              <GavetaCarrinho />
              <BotaoContaCliente />
            </div>
            <div className="col-span-3 min-w-0 md:order-2 md:flex-1">
              <CampoBuscaProdutos />
            </div>
          </div>
        </div>
      </div>
      <nav
        className="hidden border-b border-[#E5E7EB] bg-[#EFF6FF] md:block"
        aria-label="Navegação principal"
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="scrollbar-none flex items-center gap-1 overflow-x-auto py-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold whitespace-nowrap text-[#0C447C] transition-colors hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
              aria-label="Abrir categorias"
              aria-expanded={menuAberto}
            >
              <Menu className="size-4" />
              Categorias
            </button>
            <span className="text-[#E5E7EB] select-none">|</span>
            <Link
              href="/ofertas-do-dia"
              className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap text-[#1F2937] transition-colors hover:text-[#0C447C] focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
            >
              <Zap className="size-4" style={{ color: cores.destaque }} />
              Ofertas do Dia
            </Link>
            <Link
              href="/#confira-tambem"
              className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap text-[#1F2937] transition-colors hover:text-[#0C447C] focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
            >
              <Compass className="size-4" style={{ color: cores.sucesso }} />
              Confira também
            </Link>
            <Link
              href="/lancamentos"
              className="flex min-h-9 shrink-0 items-center rounded-md px-3 py-1.5 whitespace-nowrap text-[#1F2937] transition-colors hover:text-[#0C447C] focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
            >
              Lançamentos
            </Link>
            <Link
              href="/marcas"
              className="flex min-h-9 shrink-0 items-center rounded-md px-3 py-1.5 whitespace-nowrap text-[#1F2937] transition-colors hover:text-[#0C447C] focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
            >
              Marcas
            </Link>
            <Link
              href="/black-friday"
              className="ml-auto flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-bold whitespace-nowrap text-[#DC2626] transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:outline-none"
            >
              <Tag className="size-4" />
              Black Friday
            </Link>
          </div>
        </div>
      </nav>
      <NavigationDrawer
        isOpen={menuAberto}
        onClose={() => setMenuAberto(false)}
      />
    </header>
  );
}
