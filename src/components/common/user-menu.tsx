// components/common/auth-button.tsx
'use client';

import { UserIcon, LogOutIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export const AuthButton = () => {
  const { session, signOut } = useAuth(); // Agora signOut está disponível

  if (session?.user) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 gap-2"
        onClick={signOut} // Usando signOut do hook
      >
        <LogOutIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" size="sm" className="h-8 gap-2">
      <Link href="/authentication">
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar / Cadastrar</span>
      </Link>
    </Button>
  );
};