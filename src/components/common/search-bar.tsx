// components/common/search-bar.tsx
'use client';

import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  shortcut?: string;
  onSubmit?: (query: string) => void;
  className?: string;
}

export const SearchBar = ({
  placeholder = 'Search...',
  shortcut = '⌘K',
  onSubmit,
  className
}: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    onSubmit?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Input
        name="search"
        className="peer h-8 ps-8 pe-10 w-full"
        placeholder={placeholder}
        type="search"
      />
      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 peer-disabled:opacity-50">
        <SearchIcon size={16} />
      </div>
      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2">
        <kbd className="text-muted-foreground/70 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
          {shortcut}
        </kbd>
      </div>
    </form>
  );
};