"use client";
import { useQuery } from "@tanstack/react-query";

import { consultarAtendimentoPublicoJaaa } from "../../../actions/jaaa/consultar-jaaa";
import { chavesJaaa } from "../../../constants/jaaa/chaves";
import { CartaoAcessoJaaa } from "../../jaaa/cartao-acesso-jaaa";
/** Consulta mínima; o clique revalida no servidor mesmo quando a PDP já estava aberta. */
export function AtendimentoPublicoJaaa({ produtoId }: { produtoId: string }) {
  const q = useQuery({
    queryKey: chavesJaaa.publico(produtoId),
    queryFn: () => consultarAtendimentoPublicoJaaa({ produtoId }),
    retry: false,
  });
  return <CartaoAcessoJaaa cliente destino={q.data?.destino ?? null} />;
}
