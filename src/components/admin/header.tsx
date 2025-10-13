// src/components/admin/header.tsx
"use client";

import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const AdminHeader = () => {
  return (
    <header className="border-b bg-white p-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Pesquisar..."
            className="pl-10"
          />
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium"></span>
          </div>
        </div>
      </div>
    </header>
  );
};