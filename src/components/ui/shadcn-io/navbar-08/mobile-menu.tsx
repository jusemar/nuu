// components/ui/shadcn-io/navbar-08/mobile-menu.tsx
'use client';

import { UserIcon, LogOutIcon, MenuIcon } from 'lucide-react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth-client';
import  Navbar08NavItem  from '.';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  navigationLinks: Array<{
    title: string;
    href: string;
    active?: boolean;
  }>;
  onNavItemClick?: (href: string) => void;
}

export const MobileMenu = ({ navigationLinks, onNavItemClick }: MobileMenuProps) => {
  const { session } = useAuth();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
          variant="ghost"
          size="icon"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        <NavigationMenu className="max-w-none">
          <NavigationMenuList className="flex-col items-start gap-0">
            {navigationLinks.map((link, index) => (
              <NavigationMenuItem key={index} className="w-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavItemClick && link.href) onNavItemClick(link.href);
                  }}
                  className={cn(
                    'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer',
                    link.active && 'bg-accent text-accent-foreground'
                  )}
                >
                  {link.title}
                </button>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Seção de usuário no mobile - IGUAL AO HEADER ORIGINAL */}
        <div className="mt-4 border-t pt-4 px-3">
          {session?.user ? (
            <div className="flex justify-between items-center space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image as string | undefined} />
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
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => authClient.signOut()}
              >
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Olá. Faça seu login!</h2>
              <Button size="icon" asChild variant="outline" className="h-8 w-8">
                <Link href="/authentication">
                  <UserIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};