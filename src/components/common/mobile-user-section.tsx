// components/common/mobile-user-section.tsx
'use client';

import { LogInIcon, LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

interface MobileUserSectionProps {
  onLoginClick?: () => void;
}

export const MobileUserSection = ({ onLoginClick }: MobileUserSectionProps) => {
  const { session, signOut } = useAuth();

  if (session?.user) {
    return (
      <div className="flex justify-between items-center py-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback className="text-xs">
              {session.user.name?.split(' ')?.[0]?.[0]}
              {session.user.name?.split(' ')?.[1]?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{session.user.name}</h3>
            <span className="text-muted-foreground block text-xs">
              {session.user.email}
            </span>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={signOut}>
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4 border-t">
      <h2 className="font-semibold text-sm">Olá. Faça seu login!</h2>
      <Button size="icon" asChild variant="outline">
        <a href="/authentication" onClick={onLoginClick}>
          <LogInIcon className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};