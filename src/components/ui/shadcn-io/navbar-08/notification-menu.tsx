// components/ui/shadcn-io/navbar-08/index.tsx
'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/shadcn-io/navbar-08/logo';
import { SearchBar } from '@/components/common/search-bar';
import { AuthButton } from '@/components/common/auth-button';
import { MobileMenu } from './mobile-menu';
import { DesktopNavigation } from './desktop-navigation';

// Interfaces
export interface Navbar08NavItem {
  href: string;
  title: string;
  active?: boolean;
}

export interface Navbar08Props extends React.HTMLAttributes<HTMLElement> {
  logoHref?: string;
  navigationLinks?: Navbar08NavItem[];
  searchPlaceholder?: string;
  searchShortcut?: string;
  onNavItemClick?: (href: string) => void;
  onSearchSubmit?: (query: string) => void;
}

// Default navigation links
const defaultNavigationLinks: Navbar08NavItem[] = [
  { href: '/', title: 'Home', active: true },
  { href: '/products', title: 'Produtos' },
  { href: '/categories', title: 'Categorias' },
  { href: '/about', title: 'Sobre' },
];

export const Navbar08 = React.forwardRef<HTMLElement, Navbar08Props>(
  (
    {
      className,
      logoHref = '/',
      navigationLinks = defaultNavigationLinks,
      searchPlaceholder = 'Search...',
      searchShortcut = '⌘K',
      onNavItemClick,
      onSearchSubmit,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

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

    const combinedRef = React.useCallback((node: HTMLElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    return (
      <header
        ref={combinedRef}
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6',
          className
        )}
        {...props}
      >
        <div className="container mx-auto max-w-screen-2xl">
          {/* Top section */}
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex flex-1 items-center gap-2">
              {/* Mobile menu */}
              {isMobile && (
                <MobileMenu 
                  navigationLinks={navigationLinks}
                  onNavItemClick={onNavItemClick}
                />
              )}
              
              {/* Logo */}
              <Logo href={logoHref} />
            </div>

            {/* Middle area - Search */}
            <div className="grow">
              <SearchBar
                placeholder={searchPlaceholder}
                shortcut={searchShortcut}
                onSubmit={onSearchSubmit}
                className="mx-auto max-w-xs"
              />
            </div>

            {/* Right side */}
            <div className="flex flex-1 items-center justify-end">
              <AuthButton />
            </div>
          </div>

          {/* Bottom navigation - Desktop */}
          {!isMobile && (
            <DesktopNavigation 
              navigationLinks={navigationLinks}
              onNavItemClick={onNavItemClick}
            />
          )}
        </div>
      </header>
    );
  }
);

Navbar08.displayName = 'Navbar08';

export default Navbar08;