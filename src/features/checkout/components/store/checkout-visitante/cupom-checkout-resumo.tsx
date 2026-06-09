"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, TicketPercent, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  calcularPreviaTotaisPedido,
  type ResultadoCalcularPreviaTotaisPedido,
} from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido";
import type { ItemCarrinho } from "@/features/carrinho";
import { CHAVE_STORAGE_CUPOM_CARRINHO } from "@/features/promocoes/constants/cupom-carrinho-storage";
import type { ResultadoValidarCupomPromocao } from "@/features/promocoes/services";

import { formatarPrecoCarrinho } from "@/features/carrinho";

type CupomCheckoutResumoProps = {
  itens: ItemCarrinho[];
  subtotalEmCentavos: number;
  onResultadoCupom: (resultado: ResultadoValidarCupomPromocao | null) => void;
  onPreviaTotais: (
    resultado: ResultadoCalcularPreviaTotaisPedido | null,
  ) => void;
};

type CupomPersistidoCarrinho = {
  codigo: string;
  subtotalValidadoEmCentavos?: number;
  resultado: ResultadoValidarCupomPromocao | null;
};

function lerCupomPersistido(): CupomPersistidoCarrinho | null {
  if (typeof window === "undefined") return null;

  try {
    const valor = window.localStorage.getItem(CHAVE_STORAGE_CUPOM_CARRINHO);
    return valor ? (JSON.parse(valor) as CupomPersistidoCarrinho) : null;
  } catch {
    return null;
  }
}

function limparCupomPersistido() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE_STORAGE_CUPOM_CARRINHO);
}

function persistirCupomValidado({
  codigo,
  subtotalEmCentavos,
  resultado,
}: {
  codigo: string;
  subtotalEmCentavos: number;
  resultado: ResultadoValidarCupomPromocao;
}) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CHAVE_STORAGE_CUPOM_CARRINHO,
    JSON.stringify({
      codigo,
      subtotalValidadoEmCentavos: subtotalEmCentavos,
      resultado,
    }),
  );
}

export function CupomCheckoutResumo({
  itens,
  subtotalEmCentavos,
  onResultadoCupom,
  onPreviaTotais,
}: CupomCheckoutResumoProps) {
  const [codigoCupom, setCodigoCupom] = useState<string | null>(null);
  const [resultado, setResultado] =
    useState<ResultadoValidarCupomPromocao | null>(null);
  const [isPending, startTransition] = useTransition();

  const descontoEstimado = resultado?.valido
    ? resultado.descontoEstimadoEmCentavos
    : 0;
  const codigoResumo = useMemo(
    () => codigoCupom ?? resultado?.codigo ?? null,
    [codigoCupom, resultado?.codigo],
  );

  useEffect(() => {
    const cupomPersistido = lerCupomPersistido();

    if (!cupomPersistido?.codigo) {
      setCodigoCupom(null);
      setResultado(null);
      onResultadoCupom(null);
      return;
    }

    const codigo = cupomPersistido.codigo.trim().toUpperCase();
    setCodigoCupom(codigo);

    startTransition(async () => {
      const previa = await calcularPreviaTotaisPedido({
        itens,
        codigoCupom: codigo,
      });
      const validacao = previa?.cupom ?? null;

      setResultado(validacao);
      onResultadoCupom(validacao?.valido ? validacao : null);
      onPreviaTotais(validacao?.valido ? previa : null);

      if (!validacao?.valido) {
        limparCupomPersistido();
        return;
      }

      persistirCupomValidado({
        codigo,
        subtotalEmCentavos,
        resultado: validacao,
      });
    });
  }, [onResultadoCupom, subtotalEmCentavos]);

  function removerCupom() {
    setCodigoCupom(null);
    setResultado(null);
    onResultadoCupom(null);
    onPreviaTotais(null);
    limparCupomPersistido();
  }

  if (!codigoResumo && !isPending) {
    return null;
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
      <div className="flex items-start gap-2">
        {isPending ? (
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
        ) : resultado?.valido ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        ) : (
          <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">
              {resultado?.valido ? "Cupom revalidado" : "Cupom do carrinho"}
            </p>
            {codigoResumo ? (
              <span className="rounded-full bg-white px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
                {codigoResumo}
              </span>
            ) : null}
          </div>

          {isPending ? (
            <p className="mt-1 text-emerald-800 dark:text-emerald-200">
              Revalidando cupom no servidor...
            </p>
          ) : resultado?.valido ? (
            <p className="mt-1 text-emerald-800 dark:text-emerald-200">
              Economia estimada: {formatarPrecoCarrinho(descontoEstimado)}.
            </p>
          ) : resultado ? (
            <p className="mt-1 text-rose-700 dark:text-rose-200">
              {resultado.mensagem} O cupom foi removido do resumo.
            </p>
          ) : null}
        </div>

        {codigoResumo ? (
          <Button
            type="button"
            variant="ghost"
            className="h-7 px-2 text-[11px] text-emerald-800 hover:bg-emerald-100 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
            onClick={removerCupom}
            disabled={isPending}
          >
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
