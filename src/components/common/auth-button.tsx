// components/common/auth-button.tsx
'use client';

import { UserIcon, LogOutIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth-client';

export const AuthButton = () => {
  const { session } = useAuth();

  if (session?.user) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 gap-2"
        onClick={() => authClient.signOut()}
      >
        <LogOutIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" size="sm" className="h-8 gap-2">
      <Link href="/authentication" legacyBehavior>
        <a className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Entrar / Cadastrar</span>
        </a>
      </Link>
    </Button>
  );
};