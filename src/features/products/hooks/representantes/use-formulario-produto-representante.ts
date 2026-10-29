"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  consultarOpcoesFormularioRepresentante,
  consultarProdutoEdicaoRepresentante,
} from "../../actions/representantes/consultar-produtos-representante";
import { criarProdutoRepresentante } from "../../actions/representantes/criar-produto-representante";
import { editarProdutoRepresentante } from "../../actions/representantes/editar-produto-representante";
import {
  type DadosFormularioRepresentante,
  formularioProdutoRepresentanteSchema,
} from "../../components/admin/representantes/campos-formulario-representante";
import { chavesProdutosRepresentante } from "../../constants/representantes/query-keys";
import { dadosProdutoRepresentanteSchema } from "../../schemas/representantes/produto-representante.schema";
import type { PerfilProdutosAdmin } from "../../types/representantes/produto-representante.types";
const dadosVazios = dadosProdutoRepresentanteSchema
  .omit({ categoriaId: true, marcaId: true })
  .parse({ nome: "Novo produto", precoCentavos: 1, estoque: 0 });
const { precoCentavos: precoInicial, ...camposVazios } = dadosVazios;
void precoInicial;
const valoresIniciais = {
  ...camposVazios,
  nome: "",
  categoriaId: "",
  marcaId: "",
  preco: "",
};
export function useFormularioProdutoRepresentante({
  perfil,
  produtoId,
  fornecedorInicial,
}: {
  perfil: PerfilProdutosAdmin;
  produtoId?: string;
  fornecedorInicial?: string;
}) {
  const router = useRouter();
  const cliente = useQueryClient();
  const [fornecedorEscolhido, setFornecedorEscolhido] = useState("");
  const [versaoBase, setVersaoBase] = useState("");
  const [aba, setAba] = useState("basico");
  const [erro, setErro] = useState("");
  const fornecedorId =
    fornecedorInicial ??
    (perfil.fornecedores.length === 1
      ? perfil.fornecedores[0].id
      : fornecedorEscolhido);
  const fornecedorValido = perfil.fornecedores.some(
    (f) => f.id === fornecedorId,
  );
  const opcoes = useQuery({
    queryKey: chavesProdutosRepresentante.opcoes(),
    queryFn: consultarOpcoesFormularioRepresentante,
  });
  const produto = useQuery({
    queryKey: chavesProdutosRepresentante.produto(
      produtoId ?? "",
      fornecedorId,
    ),
    queryFn: () =>
      consultarProdutoEdicaoRepresentante({ produtoId, fornecedorId }),
    enabled: !!produtoId && fornecedorValido,
    staleTime: 0,
  });
  const formulario = useForm<
    z.input<typeof formularioProdutoRepresentanteSchema>,
    unknown,
    DadosFormularioRepresentante
  >({
    resolver: zodResolver(formularioProdutoRepresentanteSchema),
    defaultValues: valoresIniciais,
  });
  useEffect(() => {
    if (produto.data && !formulario.formState.isDirty) {
      setVersaoBase(produto.data.versao);
      const { precoCentavos, ...campos } = produto.data.dados;
      formulario.reset({
        ...campos,
        pesoGramas:
          campos.pesoGramas === null ? null : campos.pesoGramas / 1000,
        preco: (precoCentavos / 100).toFixed(2).replace(".", ","),
      });
    }
  }, [produto.data, formulario, formulario.formState.isDirty]);
  const salvar = useMutation({
    mutationFn: async (dados: DadosFormularioRepresentante) => {
      if (!fornecedorValido)
        throw new Error("Selecione o fornecedor representado.");
      const { preco, ...campos } = dados;
      const entrada = {
        fornecedorId,
        dados: {
          ...campos,
          pesoGramas:
            campos.pesoGramas === null
              ? null
              : Math.round((campos.pesoGramas ?? 0) * 1000),
          precoCentavos: Math.round(Number(preco.replace(",", ".")) * 100),
        },
      };
      const resultado = produtoId
        ? await editarProdutoRepresentante({
            ...entrada,
            produtoId,
            versao: versaoBase,
          })
        : await criarProdutoRepresentante(entrada);
      if (!resultado.sucesso) throw new Error(resultado.mensagem);
      return resultado.dados;
    },
    onSuccess: async (resultado) => {
      setErro("");
      formulario.reset(formulario.getValues());
      await cliente.invalidateQueries({
        queryKey: chavesProdutosRepresentante.todas,
      });
      toast.success(
        produtoId
          ? "Produto atualizado."
          : "Rascunho criado. Agora você pode adicionar imagens.",
      );
      if (!produtoId)
        router.replace(
          `/admin/products/${resultado.produtoId}/edit?fornecedor=${fornecedorId}`,
        );
    },
    onError: (erro) => {
      setErro(erro.message);
      toast.error(erro.message);
    },
  });
  function errosFormulario() {
    setErro("Revise os campos obrigatórios destacados.");
    const campos = formulario.formState.errors;
    setAba(campos.preco || campos.estoque || campos.prazo ? "preco" : "basico");
  }

  return {
    fornecedorId,
    fornecedorValido,
    fornecedorEscolhido,
    setFornecedorEscolhido,
    aba,
    setAba,
    erro,
    opcoes,
    produto,
    formulario,
    salvar,
    errosFormulario,
  };
}
