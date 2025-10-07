"use client";

import { SortSelect } from "@/components/common/sort-select";

export const SortSection = () => {
  const handleSortChange = (value: string) => {
    console.log("Ordenar por:", value);
  };

  return <SortSelect onSortChange={handleSortChange} />;
};