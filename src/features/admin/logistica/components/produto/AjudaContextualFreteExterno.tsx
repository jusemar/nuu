"use client";

import { CircleHelp } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PropriedadesAjudaContextualFreteExterno = {
  titulo: string;
  descricao: string;
};

export function AjudaContextualFreteExterno({
  titulo,
  descricao,
}: PropriedadesAjudaContextualFreteExterno) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground h-6 w-6"
          aria-label={`Ajuda: ${titulo}`}
        >
          <CircleHelp className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 space-y-1 p-3 text-sm leading-relaxed"
      >
        <p className="font-medium">{titulo}</p>
        <p className="text-muted-foreground">{descricao}</p>
      </PopoverContent>
    </Popover>
  );
}
