import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Container oficial da plataforma.
 * Centraliza largura máxima e gutters responsivos de todas as páginas.
 */
type ContainerProps = React.ComponentProps<"div"> & {
  as?: "div" | "main";
};

function Container({
  as: Elemento = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Elemento
      data-slot="container"
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export { Container };
