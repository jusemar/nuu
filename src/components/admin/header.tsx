// src/components/admin/header.tsx
"use client";

import { Bell, LogOut, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

          {/* Avatar do usuário (escondido em mobile muito pequeno) */}
          <div className="hidden items-center gap-3 border-l pl-3 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 ring-1 ring-gray-200">
              <User className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="hidden lg:block">
              <p className="max-w-40 truncate text-sm font-semibold text-gray-900">
                {usuario.name}
              </p>
              <p className="max-w-40 truncate text-xs text-gray-500">
                {usuario.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={sair}
              aria-label="Sair do painel"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Placeholder para espaço do hamburger em mobile */}
      <div className="h-0 lg:hidden"></div>
    </header>
  );
};
