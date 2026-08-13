"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { salvarVendaCruzadaAdmin } from "../actions/salvar-venda-cruzada-admin";
import { chavesQueryVendaCruzada } from "./chaves-query-venda-cruzada";

export function useSalvarVendaCruzada(produtoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salvarVendaCruzadaAdmin,
    onSuccess: async (resultado) => {
      if (!resultado.sucesso) return;
      await queryClient.invalidateQueries({
        queryKey: chavesQueryVendaCruzada.configuracao(produtoId),
      });
    },
  });
}
