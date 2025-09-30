// components/ui/shadcn-io/navbar-08/desktop-navigation.tsx
'use client';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Navbar08NavItem } from '.';
import { cn } from '@/lib/utils';

interface DesktopNavigationProps {
  navigationLinks: Navbar08NavItem[];
  onNavItemClick?: (href: string) => void;
}

export const DesktopNavigation = ({ navigationLinks, onNavItemClick }: DesktopNavigationProps) => {
  return (
    <div className="border-t py-2">
      <NavigationMenu>
        <NavigationMenuList className="gap-2">
          {navigationLinks.map((link, index) => (
            <NavigationMenuItem key={index}>
              <NavigationMenuLink
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavItemClick && link.href) onNavItemClick(link.href);
                }}
                className={cn(
                  'text-muted-foreground hover:text-primary py-1.5 font-medium transition-colors cursor-pointer group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                  link.active && 'text-primary'
                )}
              >
                {link.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};