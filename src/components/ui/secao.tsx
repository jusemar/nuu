import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Ritmo vertical oficial para seções de páginas públicas.
 */
function Secao({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="secao"
      className={cn("space-y-5 md:space-y-6", className)}
      {...props}
    />
  );
}

export { Secao };
