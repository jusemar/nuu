"use client";

import { useEffect } from "react";

import { useContextoCepLogistica } from "../components/store/contexto-cep-logistica-provider";

export function usePrevisaoEntregaProdutoCard(produtoId: string) {
  const { previsaoPorProduto, registrarProduto } = useContextoCepLogistica();

  useEffect(() => {
    return registrarProduto(produtoId);
  }, [produtoId, registrarProduto]);

  return { data: previsaoPorProduto[produtoId] ?? null };
}
