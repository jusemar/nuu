"use client";

import { useCallback, useEffect, useState } from "react";

import { EVENTO_ABRIR_GAVETA_CARRINHO } from "../constants/carrinho-storage";

export function abrirGavetaCarrinho() {
  window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_GAVETA_CARRINHO));
}

export function useGavetaCarrinho() {
  const [aberta, setAberta] = useState(false);

  const abrir = useCallback(() => setAberta(true), []);
  const fechar = useCallback(() => setAberta(false), []);

  useEffect(() => {
    window.addEventListener(EVENTO_ABRIR_GAVETA_CARRINHO, abrir);

    return () => {
      window.removeEventListener(EVENTO_ABRIR_GAVETA_CARRINHO, abrir);
    };
  }, [abrir]);

  return {
    aberta,
    abrir,
    fechar,
    setAberta,
  };
}
