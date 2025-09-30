// components/common/logo.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
}

export const Logo = ({ 
  href = '/', 
  className = '',
  showText = true 
}: LogoProps) => {
  return (
    <Link 
      href={href} 
      className={cn(
        'flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors',
        className
      )}
      // Adicione passHref e legacyBehavior se necessário
      passHref
      legacyBehavior
    >
      {/* Remova a tag <a> manual ou use como children */}
      <div className="flex items-center space-x-2">
        <div className="text-2xl">
          <svg width='1em' height='1em' viewBox='0 0 324 323' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
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
        </div>
        {showText && (
          <span className="hidden font-bold text-xl sm:inline-block">Do Rocha</span>
        )}
      </div>
    </Link>
  );
};