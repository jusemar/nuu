"use client";

import { useMemo, useState } from "react";

import type { PrecosProdutoPorModalidade } from "@/features/precificacao";

import type { Modalidade, PrecoModalidade } from "../types/product.types";

interface UseProductPricingReturn {
  modalidadeAtiva: PrecoModalidade;
  modalidadesDisponiveis: PrecoModalidade[];
  selecionarModalidade: (tipo: Modalidade) => void;
  precoPixFormatado: string;
  precoNormalFormatado: string;
  precoParceladoFormatado: string;
  descontoPix: number;
  prazoEntrega: string;
}

export function useProductPricing(
  precos: PrecoModalidade[],
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade,
): UseProductPricingReturn {
  const [modalidadeSelecionada, setModalidadeSelecionada] =
    useState<Modalidade>(() => {
      const modalidadesAtivas = precos.filter((preco) => preco.isActive);
      return modalidadesAtivas[0]?.type || "stock";
    });

  const modalidadeAtiva = useMemo(() => {
    const encontrada = precos.find(
      (preco) => preco.type === modalidadeSelecionada,
    );

    return encontrada || precos.find((preco) => preco.isActive) || precos[0];
  }, [precos, modalidadeSelecionada]);

  const modalidadesDisponiveis = useMemo(
    () => precos.filter((preco) => preco.isActive),
    [precos],
  );

  const precoCalculado = precosCalculadosPorModalidade[modalidadeAtiva.type];
  const parcelamentoDestaque = precoCalculado?.cartao.parcelamentos[0];
  const descontoPix = precoCalculado
    ? Math.round(
        (1 -
          precoCalculado.pix.valorEmCentavos /
            precoCalculado.cartao.valorEmCentavos) *
          100,
      )
    : 0;

  function selecionarModalidade(tipo: Modalidade) {
    const existe = precos.find(
      (preco) => preco.type === tipo && preco.isActive,
    );

    if (existe) {
      setModalidadeSelecionada(tipo);
    }
  }

  return {
    modalidadeAtiva,
    modalidadesDisponiveis,
    selecionarModalidade,
    precoPixFormatado: precoCalculado?.pix.valor || "",
    precoNormalFormatado: precoCalculado?.cartao.valor || "",
    precoParceladoFormatado: parcelamentoDestaque
      ? `${parcelamentoDestaque.parcelas}x de ${parcelamentoDestaque.valor}`
      : "",
    descontoPix,
    prazoEntrega: modalidadeAtiva.deliveryDays || "Consulte prazo",
  };
}
