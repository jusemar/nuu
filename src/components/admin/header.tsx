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
    <header className="bg-background/80 border-border/70 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 lg:hidden">
          <p className="text-muted-foreground text-xs font-medium">Admin</p>
          <h1 className="truncate text-base font-semibold">{titulo}</h1>
        </div>

        {/* A busca ocupa uma linha própria no mobile para não comprimir ações. */}
        <div className="order-3 w-full lg:order-none lg:max-w-2xl lg:flex-1">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Pesquisar no admin"
              aria-label="Pesquisar no admin"
              className="bg-card/75 border-border/80 h-10 w-full rounded-xl pr-10 pl-10 text-sm shadow-none transition-shadow focus-visible:shadow-sm"
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
              className="hover:border-border/70 hover:bg-card relative size-10 rounded-xl border border-transparent"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="bg-destructive ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2"></span>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="border-border/70 bg-card/70 hover:bg-card h-10 gap-2.5 rounded-xl border py-1 pr-2 pl-1.5"
                aria-label="Abrir menu da minha conta"
              >
                <span className="bg-primary-light ring-primary/10 flex size-7 items-center justify-center rounded-lg ring-1">
                  <User className="text-primary size-3.5" />
                </span>
                <span className="hidden min-w-0 text-left lg:block">
                  <span className="text-foreground block max-w-40 truncate text-sm font-semibold">
                    {usuario.name}
                  </span>
                  <span className="text-muted-foreground block max-w-40 truncate text-xs">
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
