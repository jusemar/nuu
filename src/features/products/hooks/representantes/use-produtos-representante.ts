"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { editarCampoProdutoRepresentante } from "../../actions/representantes/editar-campo-produto-representante";
import { chavesProdutosRepresentante } from "../../constants/representantes/query-keys";

export function useEditarCampoRepresentante() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (
      entrada: Parameters<typeof editarCampoProdutoRepresentante>[0],
    ) => {
      const resultado = await editarCampoProdutoRepresentante(entrada);
      if (!resultado.sucesso) throw new Error(resultado.mensagem);
      return resultado.dados;
    },
    onSuccess: async () => {
      await cliente.invalidateQueries({
        queryKey: chavesProdutosRepresentante.todas,
      });
      toast.success("Produto atualizado.");
    },
    onError: (erro) => {
      toast.error(erro.message);
      void cliente.invalidateQueries({
        queryKey: chavesProdutosRepresentante.todas,
      });
    },
  });
}
