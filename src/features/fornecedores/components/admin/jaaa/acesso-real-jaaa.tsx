"use client";
import { useMeuJaaa } from "../../../hooks/jaaa/use-jaaa";
import { CartaoAcessoJaaa } from "../../jaaa/cartao-acesso-jaaa";
export function MeuAcessoJaaa() {
  const q = useMeuJaaa();
  return <CartaoAcessoJaaa destino={q.data?.destino ?? null} />;
}
