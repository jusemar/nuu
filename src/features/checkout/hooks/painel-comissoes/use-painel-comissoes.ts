"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";

import {
  consultarDetalheComissao,
  consultarOpcoesComissoes,
  consultarPainelComissoes,
} from "../../actions/painel-comissoes/consultar-painel";
import { registrarQuitacaoComissao } from "../../actions/painel-comissoes/registrar-quitacao";
import { chavesPainelComissoes as chaves } from "../../constants/painel-comissoes/chaves";
import type { quitarComissaoSchema } from "../../schemas/painel-comissoes/painel.schema";
import type { FiltrosPainelComissoes } from "../../types/painel-comissoes/painel.types";
export function usePainelComissoes(f: FiltrosPainelComissoes) {
  return useQuery({
    queryKey: chaves.lista(f),
    queryFn: () => consultarPainelComissoes(f),
  });
}
export function useDetalheComissao(id: string) {
  return useQuery({
    queryKey: chaves.detalhe(id),
    queryFn: () => consultarDetalheComissao(id),
    enabled: !!id,
  });
}
export function useOpcoesComissoes(gestor: boolean) {
  return useQuery({
    queryKey: chaves.opcoes(),
    queryFn: consultarOpcoesComissoes,
    enabled: gestor,
  });
}
export function useQuitarComissao() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: z.input<typeof quitarComissaoSchema>) => {
      const r = await registrarQuitacaoComissao(entrada);
      if (!r.sucesso) throw new Error(r.mensagem);
      return r.dados;
    },
    onSuccess: async (r) => {
      await cliente.invalidateQueries({ queryKey: chaves.todas });
      toast.success(
        r.jaExistia
          ? "Quitação já registrada."
          : "Quitação externa registrada.",
      );
    },
    onError: (e) => toast.error(e.message),
  });
}
