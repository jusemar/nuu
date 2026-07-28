// src/components/admin/header.tsx
"use client";

import { Bell, LogOut, Search, User, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type AdminHeaderProps = {
  usuario: { name: string; email: string; image?: string | null };
};

export const AdminHeader = ({ usuario }: AdminHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const titulosPorRota: Array<[string, string]> = [
    ["/admin/products", "Produtos"],
    ["/admin/orders", "Pedidos"],
    ["/admin/categories", "Categorias"],
    ["/admin/fornecedores", "Fornecedores"],
    ["/admin/marketing", "Marketing"],
    ["/admin/logistica", "Logística"],
    ["/admin/logistics", "Logística"],
    ["/admin/configuracoes", "Configurações"],
    ["/admin/precificacao", "Precificação"],
    ["/admin/marcas", "Marcas"],
    ["/admin/minha-conta", "Minha conta"],
  ];
  const titulo =
    titulosPorRota.find(([rota]) => pathname.startsWith(rota))?.[1] ??
    "Visão geral";

  async function sair() {
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="bg-background/95 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 lg:hidden">
          <p className="text-muted-foreground text-xs font-medium">Admin</p>
          <h1 className="truncate text-base font-semibold">{titulo}</h1>
        </div>

        {/* A busca ocupa uma linha própria no mobile para não comprimir ações. */}
        <div className="order-3 w-full lg:order-none lg:max-w-2xl lg:flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Pesquisar no admin"
              aria-label="Pesquisar no admin"
              className="h-10 w-full pr-10 pl-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
                aria-label="Limpar pesquisa"
              >
                <span className="text-sm text-gray-500">×</span>
              </Button>
            )}
          </div>
        </div>

        {/* User Menu */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative size-11"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-red-500"></span>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 gap-3 border-l py-1.5 pl-3"
                aria-label="Abrir menu da minha conta"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 ring-1 ring-gray-200">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                </span>
                <span className="hidden min-w-0 text-left lg:block">
                  <span className="block max-w-40 truncate text-sm font-semibold text-gray-900">
                    {usuario.name}
                  </span>
                  <span className="block max-w-40 truncate text-xs text-gray-500">
                    {usuario.email}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="truncate text-sm font-medium">{usuario.name}</p>
                <p className="text-muted-foreground truncate text-xs font-normal">
                  {usuario.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/minha-conta">
                  <UserRound aria-hidden="true" />
                  Minha conta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void sair()}>
                <LogOut aria-hidden="true" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
