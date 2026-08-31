"use client";

import { createContext, type ReactNode, useContext } from "react";

type IdentidadeVisual = {
  logoCabecalhoUrl: string | null;
  logoRodapeUrl: string | null;
};

const ContextoIdentidadeVisual = createContext<IdentidadeVisual>({
  logoCabecalhoUrl: null,
  logoRodapeUrl: null,
});

export function ProvedorIdentidadeVisual({
  identidade,
  children,
}: {
  identidade: IdentidadeVisual;
  children: ReactNode;
}) {
  return (
    <ContextoIdentidadeVisual.Provider value={identidade}>
      {children}
    </ContextoIdentidadeVisual.Provider>
  );
}

// O prefixo `use` é obrigatório pelo contrato técnico dos Hooks do React.
export function useIdentidadeVisual() {
  return useContext(ContextoIdentidadeVisual);
}
