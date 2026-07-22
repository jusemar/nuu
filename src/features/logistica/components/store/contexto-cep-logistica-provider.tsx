"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CHAVE_STORAGE_CARRINHO,
  EVENTO_CARRINHO_ATUALIZADO,
} from "@/features/carrinho/constants/carrinho-storage";
import type { ItemCarrinho } from "@/features/carrinho";
import { clienteAutenticacao } from "@/features/autenticacao/lib/cliente-autenticacao";

import { buscarCepEnderecoClienteLogado } from "../../actions/buscar-cep-endereco-cliente-logado";
import { consultarPrevisoesEntregaPropriaProdutosLoja } from "../../actions/consultar-entrega-propria-loja";
import {
  CHAVE_STORAGE_CEP_CLIENTE,
  EVENTO_CEP_CLIENTE_ATUALIZADO,
  EVENTO_ENDERECO_CLIENTE_ATUALIZADO,
} from "../../constants/cep-cliente";
import {
  chaveCepEnderecoCliente,
  chavesPrevisaoEntregaProduto,
} from "../../constants/chaves-query-logistica";
import {
  normalizarCepCliente,
  resolverCepCliente,
  type OrigemCepCliente,
} from "../../lib/cep-cliente";

type ContextoCepLogistica = {
  cep: string;
  origem: OrigemCepCliente;
  registrarProduto: (produtoId: string) => () => void;
  previsaoPorProduto: Record<string, string>;
};

const Contexto = createContext<ContextoCepLogistica | null>(null);

function lerCepManual() {
  return normalizarCepCliente(
    window.localStorage.getItem(CHAVE_STORAGE_CEP_CLIENTE) ?? "",
  );
}

function lerCepCarrinho() {
  try {
    const itens = JSON.parse(
      window.localStorage.getItem(CHAVE_STORAGE_CARRINHO) ?? "[]",
    ) as ItemCarrinho[];
    return normalizarCepCliente(
      itens.find((item) => item.freteEscolhido?.cep)?.freteEscolhido?.cep ?? "",
    );
  } catch {
    return "";
  }
}

export function ContextoCepLogisticaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: sessao, isPending: restaurandoSessao } =
    clienteAutenticacao.useSession();
  const usuarioId = sessao?.user.id ?? null;
  const [cepManual, setCepManual] = useState("");
  const [cepCarrinho, setCepCarrinho] = useState("");
  const [produtosRegistrados, setProdutosRegistrados] = useState<
    Map<string, number>
  >(() => new Map());
  const [produtosEstabilizados, setProdutosEstabilizados] = useState<string[]>(
    [],
  );

  const consultaEndereco = useQuery({
    queryKey: [...chaveCepEnderecoCliente, usuarioId],
    queryFn: buscarCepEnderecoClienteLogado,
    enabled: Boolean(usuarioId),
    staleTime: 30_000,
  });

  useEffect(() => {
    const sincronizar = () => {
      setCepManual(lerCepManual());
      setCepCarrinho(lerCepCarrinho());
    };
    const atualizarEndereco = () => void consultaEndereco.refetch();

    sincronizar();
    window.addEventListener(EVENTO_CEP_CLIENTE_ATUALIZADO, sincronizar);
    window.addEventListener(EVENTO_CARRINHO_ATUALIZADO, sincronizar);
    window.addEventListener("storage", sincronizar);
    window.addEventListener(
      EVENTO_ENDERECO_CLIENTE_ATUALIZADO,
      atualizarEndereco,
    );
    return () => {
      window.removeEventListener(EVENTO_CEP_CLIENTE_ATUALIZADO, sincronizar);
      window.removeEventListener(EVENTO_CARRINHO_ATUALIZADO, sincronizar);
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener(
        EVENTO_ENDERECO_CLIENTE_ATUALIZADO,
        atualizarEndereco,
      );
    };
  }, [consultaEndereco.refetch]);

  const contextoCep = resolverCepCliente({
    cepManual,
    cepEndereco: usuarioId ? consultaEndereco.data : null,
    // Enquanto a sessão/endereço é restaurado, não exibimos temporariamente
    // uma previsão de menor prioridade que possa ser substituída em seguida.
    cepCarrinho:
      restaurandoSessao || (usuarioId && consultaEndereco.isPending)
        ? null
        : cepCarrinho,
  });

  const registrarProduto = useCallback((produtoId: string) => {
    setProdutosRegistrados((atuais) => {
      const proximos = new Map(atuais);
      proximos.set(produtoId, (proximos.get(produtoId) ?? 0) + 1);
      return proximos;
    });

    return () => {
      setProdutosRegistrados((atuais) => {
        const proximos = new Map(atuais);
        const quantidade = (proximos.get(produtoId) ?? 1) - 1;
        if (quantidade > 0) proximos.set(produtoId, quantidade);
        else proximos.delete(produtoId);
        return proximos;
      });
    };
  }, []);

  const assinaturaProdutos = [...produtosRegistrados.keys()].sort().join("|");
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setProdutosEstabilizados(
        assinaturaProdutos ? assinaturaProdutos.split("|") : [],
      );
    }, 30);
    return () => window.clearTimeout(temporizador);
  }, [assinaturaProdutos]);

  const consultaPrevisoes = useQuery({
    queryKey: chavesPrevisaoEntregaProduto.lote(
      produtosEstabilizados,
      contextoCep.cep,
    ),
    queryFn: () =>
      consultarPrevisoesEntregaPropriaProdutosLoja({
        produtosIds: produtosEstabilizados,
        cep: contextoCep.cep,
      }),
    enabled: contextoCep.cep.length === 8 && produtosEstabilizados.length > 0,
    staleTime: 60_000,
  });

  const valor = useMemo<ContextoCepLogistica>(
    () => ({
      cep: contextoCep.cep,
      origem: contextoCep.origem,
      registrarProduto,
      previsaoPorProduto: consultaPrevisoes.data ?? {},
    }),
    [
      consultaPrevisoes.data,
      contextoCep.cep,
      contextoCep.origem,
      registrarProduto,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useContextoCepLogistica() {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("ContextoCepLogisticaProvider não configurado.");
  }
  return contexto;
}
