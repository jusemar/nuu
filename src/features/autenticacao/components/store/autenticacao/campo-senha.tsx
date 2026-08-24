"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CampoSenha({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visivel ? "text" : "password"}
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          autoComplete={autoComplete}
          minLength={8}
          maxLength={128}
          disabled={disabled}
          required
          className="pr-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisivel((atual) => !atual)}
          disabled={disabled}
          className="absolute top-0 right-0"
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
