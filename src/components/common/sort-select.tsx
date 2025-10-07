// src/components/common/sort-select.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortSelectProps {
  onSortChange: (value: string) => void;
}

export const SortSelect = ({ onSortChange }: SortSelectProps) => {
  return (
    <Select onValueChange={onSortChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="relevant">Mais Relevantes</SelectItem>
        <SelectItem value="price_asc">Menor Preço</SelectItem>
        <SelectItem value="price_desc">Maior Preço</SelectItem>
        <SelectItem value="newest">Mais Novos</SelectItem>
      </SelectContent>
    </Select>
  );
};