"use client";

import type { ComponentProps } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** Checkbox com contraste reforçado apenas nos fluxos de fornecedores. */
export function CheckboxFornecedor({
  className,
  ...props
}: ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      className={cn(
        "size-5 border-slate-400 bg-white shadow-sm hover:border-slate-600 focus-visible:ring-slate-400/40 disabled:border-slate-300 data-[state=checked]:border-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white md:size-4",
        className,
      )}
      {...props}
    />
  );
}
