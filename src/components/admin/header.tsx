// src/components/admin/header.tsx
"use client";

import { Bell, LogOut, Search, User, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [searchQuery, setSearchQuery] = useState("");

  async function sair() {
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar - ajusta para mobile */}
        <div className="ml-14 max-w-2xl flex-1 lg:ml-0">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Pesquisar..."
              className="w-full py-2 pr-4 pl-10 text-sm"
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-red-500"></span>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto gap-3 border-l py-1.5 pl-3"
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

      {/* Placeholder para espaço do hamburger em mobile */}
      <div className="h-0 lg:hidden"></div>
    </header>
  );
};
