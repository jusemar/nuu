"use client";

import { useQuery } from "@tanstack/react-query";

import { buscarConfiguracaoVendaCruzadaAdmin } from "../actions/buscar-configuracao-venda-cruzada-admin";
import { chavesQueryVendaCruzada } from "./chaves-query-venda-cruzada";

export function useConfiguracaoVendaCruzada(produtoId: string) {
  return useQuery({
    queryKey: chavesQueryVendaCruzada.configuracao(produtoId),
    queryFn: () => buscarConfiguracaoVendaCruzadaAdmin(produtoId),
    enabled: Boolean(produtoId),
  });
}
