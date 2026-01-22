// src/components/admin/header.tsx
"use client";

import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const AdminHeader = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 border-b bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar - ajusta para mobile */}
        <div className="flex-1 max-w-2xl ml-14 lg:ml-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Pesquisar..."
              className="pl-10 pr-4 py-2 w-full text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
                aria-label="Limpar pesquisa"
              >
                <span className="text-gray-500 text-sm">×</span>
              </Button>
            )}
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
            </Button>
          </div>
          
          {/* Avatar do usuário (escondido em mobile muito pequeno) */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center ring-1 ring-gray-200">
              <User className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Placeholder para espaço do hamburger em mobile */}
      <div className="lg:hidden h-0"></div>
    </header>
  );
};