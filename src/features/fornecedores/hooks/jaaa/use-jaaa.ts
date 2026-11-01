"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  consultarConfiguracaoAtendimentoJaaa,
  consultarMeuJaaa,
} from "../../actions/jaaa/consultar-jaaa";
import { salvarAtendimentoJaaa } from "../../actions/jaaa/salvar-atendimento-jaaa";
import { salvarIdentidadeJaaa } from "../../actions/jaaa/salvar-identidade-jaaa";
import { chavesJaaa as chaves } from "../../constants/jaaa/chaves";
export function useConfiguracaoProdutoJaaa(id: string) {
  return useQuery({
    queryKey: chaves.configuracao(id),
    queryFn: () => consultarConfiguracaoAtendimentoJaaa(id),
  });
}
export function useMeuJaaa() {
  return useQuery({
    queryKey: chaves.proprio(),
    queryFn: () => consultarMeuJaaa(),
    retry: false,
  });
}
/** Toda mutação invalida apenas o domínio de atendimento; comissões não são tocadas. */
export function useSalvarJaaa(tipo: "identidade" | "produto") {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (
      d:
        | { usuarioId: string; identidade: string; ativa: boolean }
        | { produtoId: string; autorizacaoId: string | null },
    ) => {
      const r = await (tipo === "identidade"
        ? salvarIdentidadeJaaa(d)
        : salvarAtendimentoJaaa(d));
      if (!r.sucesso) throw new Error(r.mensagem);
    },
    onSuccess: async () => {
      await cliente.invalidateQueries({ queryKey: chaves.todas });
      toast.success("Atendimento pelo Jaaa atualizado.");
    },
    onError: (e) => toast.error(e.message),
  });
}
