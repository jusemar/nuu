"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export const CategoryFilter = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Exemplo de categorias - depois puxaremos do banco
  const categories = [
    { id: "1", name: "Eletrônicos" },
    { id: "2", name: "Smartphones" },
    { id: "3", name: "Acessórios" },
    { id: "4", name: "Informática" },
  ];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  return (
    <div className="space-y-4">      
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => 
                handleCategoryChange(category.id, checked as boolean)
              }
            />
            <label
              htmlFor={`category-${category.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {category.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};