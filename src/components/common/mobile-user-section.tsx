// components/common/mobile-user-section.tsx
"use client";

import { LogInIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { emailEhTecnicoTelefone } from "@/features/autenticacao/lib/email-tecnico-telefone-compartilhado";
import { useAuth } from "@/hooks/use-auth";

interface MobileUserSectionProps {
  onLoginClick?: () => void;
}

export const MobileUserSection = ({ onLoginClick }: MobileUserSectionProps) => {
  const { session, signOut } = useAuth();

  if (session?.user) {
    return (
      <div className="flex items-center justify-between border-t py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback className="text-xs">
              {session.user.name?.split(" ")?.[0]?.[0]}
              {session.user.name?.split(" ")?.[1]?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-semibold">{session.user.name}</h3>
            {!emailEhTecnicoTelefone(session.user.email) && (
              <span className="text-muted-foreground block text-xs">
                {session.user.email}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={signOut}>
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t py-4">
      <h2 className="text-sm font-semibold">Olá. Faça seu login!</h2>
      <Button size="icon" asChild variant="outline">
        <Link href="/authentication" onClick={onLoginClick}>
          <LogInIcon className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};
