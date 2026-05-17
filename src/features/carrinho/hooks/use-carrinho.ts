"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CHAVE_STORAGE_CARRINHO,
  EVENTO_CARRINHO_ATUALIZADO,
} from "../constants/carrinho-storage";
import { calcularTotaisCarrinho } from "../lib/calcular-totais-carrinho";
import type { ItemCarrinho, NovoItemCarrinho } from "../types/carrinho.types";
import { abrirGavetaCarrinho } from "./use-gaveta-carrinho";

function criarIdItemCarrinho(
  item: Pick<NovoItemCarrinho, "produtoId" | "modalidadeTipo" | "variante">,
) {
  return [
    item.produtoId,
    item.modalidadeTipo?.trim() || item.variante?.trim() || "padrao",
  ].join(":");
}

function lerCarrinhoStorage() {
  if (typeof window === "undefined") return [];

  const carrinhoSalvo = window.localStorage.getItem(CHAVE_STORAGE_CARRINHO);

  if (!carrinhoSalvo) return [];

  try {
    const itens = JSON.parse(carrinhoSalvo);
    return Array.isArray(itens) ? (itens as ItemCarrinho[]) : [];
  } catch {
    return [];
  }
}

function salvarCarrinhoStorage(itens: ItemCarrinho[]) {
  // Nesta primeira etapa, o carrinho é de visitante; o banco entra depois do login.
  window.localStorage.setItem(CHAVE_STORAGE_CARRINHO, JSON.stringify(itens));
  window.setTimeout(() => {
    // Mantém header, drawer e botões de produto sincronizados na mesma aba.
    window.dispatchEvent(new CustomEvent(EVENTO_CARRINHO_ATUALIZADO));
  }, 0);
}

export function useCarrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [itemAtualizandoId, setItemAtualizandoId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setItens(lerCarrinhoStorage());
    setCarregando(false);
  }, []);

  useEffect(() => {
    const sincronizarCarrinho = () => setItens(lerCarrinhoStorage());

    window.addEventListener(EVENTO_CARRINHO_ATUALIZADO, sincronizarCarrinho);
    window.addEventListener("storage", sincronizarCarrinho);

    return () => {
      window.removeEventListener(
        EVENTO_CARRINHO_ATUALIZADO,
        sincronizarCarrinho,
      );
      window.removeEventListener("storage", sincronizarCarrinho);
    };
  }, []);

  const atualizarItens = useCallback(
    (resolver: (itensAtuais: ItemCarrinho[]) => ItemCarrinho[]) => {
      setItens((itensAtuais) => {
        const novosItens = resolver(itensAtuais);
        salvarCarrinhoStorage(novosItens);
        return novosItens;
      });
    },
    [],
  );

  const totais = useMemo(() => calcularTotaisCarrinho(itens), [itens]);

  const adicionarItem = useCallback(
    (novoItem: NovoItemCarrinho) => {
      // O id combina produto + variante para somar quantidades do mesmo item.
      const id = criarIdItemCarrinho(novoItem);
      const quantidadeAdicionada = novoItem.quantidade ?? 1;

      setItemAtualizandoId(id);
      atualizarItens((itensAtuais) => {
        const itemExistente = itensAtuais.find((item) => item.id === id);

        if (!itemExistente) {
          return [
            ...itensAtuais,
            {
              ...novoItem,
              id,
              quantidade: quantidadeAdicionada,
            },
          ];
        }

        return itensAtuais.map((item) =>
          item.id === id
            ? {
                ...novoItem,
                id: item.id,
                quantidade: item.quantidade + quantidadeAdicionada,
              }
            : item,
        );
      });

      abrirGavetaCarrinho();
      window.setTimeout(() => setItemAtualizandoId(null), 260);
    },
    [atualizarItens],
  );

  const aumentarQuantidade = useCallback(
    (itemId: string) => {
      setItemAtualizandoId(itemId);
      atualizarItens((itensAtuais) =>
        itensAtuais.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantidade: item.quantidade + 1,
              }
            : item,
        ),
      );
      window.setTimeout(() => setItemAtualizandoId(null), 220);
    },
    [atualizarItens],
  );

  const diminuirQuantidade = useCallback(
    (itemId: string) => {
      setItemAtualizandoId(itemId);
      atualizarItens((itensAtuais) =>
        itensAtuais
          .map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantidade: item.quantidade - 1,
                }
              : item,
          )
          .filter((item) => item.quantidade > 0),
      );
      window.setTimeout(() => setItemAtualizandoId(null), 220);
    },
    [atualizarItens],
  );

  const removerItem = useCallback(
    (itemId: string) => {
      setItemAtualizandoId(itemId);
      window.setTimeout(() => {
        atualizarItens((itensAtuais) =>
          itensAtuais.filter((item) => item.id !== itemId),
        );
        setItemAtualizandoId(null);
      }, 160);
    },
    [atualizarItens],
  );

  const limparCarrinho = useCallback(() => {
    atualizarItens(() => []);
  }, [atualizarItens]);

  return {
    itens,
    totais,
    carregando,
    itemAtualizandoId,
    carrinhoVazio: itens.length === 0,
    adicionarItem,
    aumentarQuantidade,
    diminuirQuantidade,
    removerItem,
    limparCarrinho,
  };
}
