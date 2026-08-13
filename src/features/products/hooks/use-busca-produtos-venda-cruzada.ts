"use client";

import { useQuery } from "@tanstack/react-query";

import { buscarProdutosVendaCruzadaAdmin } from "../actions/buscar-produtos-venda-cruzada-admin";
import { chavesQueryVendaCruzada } from "./chaves-query-venda-cruzada";

export function useBuscaProdutosVendaCruzada(produtoId: string, busca: string) {
  return useQuery({
    queryKey: chavesQueryVendaCruzada.busca(produtoId, busca),
    queryFn: () =>
      buscarProdutosVendaCruzadaAdmin({
        produtoPrincipalId: produtoId,
        busca,
        limite: 12,
      }),
    enabled: Boolean(produtoId),
    staleTime: 30_000,
  });
}
