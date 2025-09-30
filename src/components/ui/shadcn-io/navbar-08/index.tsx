// components/ui/shadcn-io/navbar-08/index.tsx
'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { UserIcon, SearchIcon, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client'; // USE O MESMO DO HEADER
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Logo Component (no mesmo arquivo)
const Logo = () => {
  return (
    <svg width='24' height='24' viewBox='0 0 324 323' fill='currentColor'>
      <rect
        x='88.1023'
        y='144.792'
        width='151.802'
        height='36.5788'
        rx='18.2894'
        transform='rotate(-38.5799 88.1023 144.792)'
        fill='currentColor'
      />
      <rect
        x='85.3459'
        y='244.537'
        width='151.802'
        height='36.5788'
        rx='18.2894'
        transform='rotate(-38.5799 85.3459 244.537)'
        fill='currentColor'
      />
    </svg>
  );
};

export const Navbar08 = () => {
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // USE EXATAMENTE COMO NO HEADER ORIGINAL
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setIsMobile(width < 768);
      }
    };

    checkWidth();
    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header
      ref={containerRef}
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur px-4 md:px-6'
      )}
    >
      <div className="container mx-auto max-w-screen-2xl">
        {/* Top section */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex flex-1 items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64">
                  <div className="p-2">
                    <Link href="/" className="block py-2">Home</Link>
                    <Link href="/products" className="block py-2">Produtos</Link>
                    <Link href="/categories" className="block py-2">Categorias</Link>
                    
                    {/* Seção de login mobile - IGUAL AO HEADER */}
                    <div className="mt-4 border-t pt-4">
                      {!session?.user ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Olá. Faça seu login!</p>
                          <Button size="icon" asChild variant="outline">
                            <Link href="/authentication">
                              <UserIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-sm">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground">{session.user.email}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => authClient.signOut()}
                          >
                            <UserIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 text-primary">
              <Logo />
              <span className="hidden font-bold text-xl sm:inline-block">Do Rocha</span>
            </Link>
          </div>

          {/* Middle area - Search */}
          <div className="grow">
            <div className="relative mx-auto max-w-xs">
              <Input
                className="h-8 ps-8 pe-10"
                placeholder="Search..."
                type="search"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                <SearchIcon size={16} />
              </div>
            </div>
          </div>

          {/* Right side - Botão de Login SIMPLES */}
          <div className="flex flex-1 items-center justify-end">
            {!session?.user ? (
              <Button asChild variant="ghost" size="sm" className="h-8 gap-2">
                <Link href="/authentication">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => authClient.signOut()}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bottom navigation - Desktop */}
        {!isMobile && (
          <div className="border-t py-2">
            <div className="flex gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary">Home</Link>
              <Link href="/products" className="text-sm font-medium hover:text-primary">Produtos</Link>
              <Link href="/categories" className="text-sm font-medium hover:text-primary">Categorias</Link>
              <Link href="/about" className="text-sm font-medium hover:text-primary">Sobre</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar08;