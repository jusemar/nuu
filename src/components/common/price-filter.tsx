// src/components/common/price-filter.tsx
"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export const PriceFilter = () => {
  const [priceRange, setPriceRange] = useState([0, 1000]);

  return (
    <div className="space-y-4">    
      <Slider
        value={priceRange}
        onValueChange={setPriceRange}
        max={1000}
        step={10}
        className="my-6"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>R$ {priceRange[0]}</span>
        <span>R$ {priceRange[1]}</span>
      </div>
    </div>
  );
};