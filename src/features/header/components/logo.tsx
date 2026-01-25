import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = '' }: LogoProps) => {
  return (
    <Link 
      href="/" 
      className={`flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity ${className}`}
    >
      {/* Logo SVG placeholder - depois substituímos pelo seu logo real */}
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">DR</span>
      </div>
      <span className="font-bold text-xl hidden sm:inline-block">Do Rocha</span>
    </Link>
  );
};