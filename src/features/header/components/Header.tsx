"use client";

import { useIdentidadeVisual } from "@/features/configuracoes-loja/components/store/contexto-identidade-visual";

import { HeaderInterativo } from "./header-interativo";

export function Header() {
  const { logoCabecalhoUrl } = useIdentidadeVisual();
  return <HeaderInterativo logoCabecalhoUrl={logoCabecalhoUrl} />;
}
