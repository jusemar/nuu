"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ResultadoCalcularPreviaTotaisPedido } from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido";
import { calcularPreviaTotaisPedido } from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido";
import { IndicadorFreteGratisProgressivo } from "@/features/promocoes/components/store/indicador-frete-gratis-progressivo";
import type { ResultadoValidarCupomPromocao } from "@/features/promocoes/services";

import { formatarPrecoCarrinho } from "../../../lib/formatar-preco-carrinho";
import type { ItemCarrinho } from "../../../types/carrinho.types";
import { CupomCarrinho } from "./cupom-carrinho";

type ResumoCarrinhoProps = {
  itens: ItemCarrinho[];
  subtotalEmCentavos: number;
  onContinuarComprando: () => void;
};

export function ResumoCarrinho({
  itens,
  subtotalEmCentavos,
  onContinuarComprando,
}: ResumoCarrinhoProps) {
  const [resultadoCupom, setResultadoCupom] =
    useState<ResultadoValidarCupomPromocao | null>(null);
  const [previaTotais, setPreviaTotais] =
    useState<ResultadoCalcularPreviaTotaisPedido | null>(null);
  const [, startTransition] = useTransition();

  const totaisEstimados = previaTotais?.totaisPorFormaPagamento.cartao;
  const descontoCupomEmCentavos = totaisEstimados?.descontoCupomEmCentavos ?? 0;
  const descontoFretePromocionalEmCentavos =
    totaisEstimados?.descontoFretePromocionalEmCentavos ?? 0;
  const totalEstimadoEmCentavos =
    totaisEstimados?.totalEstimadoEmCentavos ?? subtotalEmCentavos;
  const cupomAplicado = resultadoCupom?.valido === true ? resultadoCupom : null;
  const atualizarResultadoCupom = useCallback(
    (resultado: ResultadoValidarCupomPromocao | null) => {
      setResultadoCupom(resultado);
    },
    [],
  );
  const possuiDescontoCupom = descontoCupomEmCentavos > 0;
  const possuiFreteGratisPromocional =
    totaisEstimados?.freteGratisPromocionalAplicado === true;
  const rotuloEconomia = useMemo(
    () =>
      formatarPrecoCarrinho(
        descontoCupomEmCentavos + descontoFretePromocionalEmCentavos,
      ),
    [descontoCupomEmCentavos, descontoFretePromocionalEmCentavos],
  );

  useEffect(() => {
    startTransition(async () => {
      const previa = await calcularPreviaTotaisPedido({ itens });
      setPreviaTotais(previa);
    });
  }, [itens, subtotalEmCentavos]);

  return (
    <footer className="border-t border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Subtotal</span>
          <strong className="font-semibold text-zinc-950 dark:text-zinc-50">
            {formatarPrecoCarrinho(subtotalEmCentavos)}
          </strong>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Frete calculado no checkout
        </p>

        <IndicadorFreteGratisProgressivo
          resultado={previaTotais?.freteGratisProgressivo}
          formatarPreco={formatarPrecoCarrinho}
        />

        <CupomCarrinho
          itens={itens}
          subtotalEmCentavos={subtotalEmCentavos}
          onResultadoCupom={atualizarResultadoCupom}
          onPreviaTotais={setPreviaTotais}
        />

        {cupomAplicado ? (
          <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between gap-3">
              <span className="text-emerald-800 dark:text-emerald-100">
                Cupom aplicado
              </span>
              <strong className="font-semibold text-emerald-950 dark:text-emerald-50">
                {cupomAplicado.codigo}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-emerald-800 dark:text-emerald-100">
                Desconto cupom
              </span>
              <strong className="font-semibold text-emerald-950 dark:text-emerald-50">
                -{formatarPrecoCarrinho(descontoCupomEmCentavos)}
              </strong>
            </div>
            {possuiDescontoCupom ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-200">
                Economia total estimada: {rotuloEconomia}
              </p>
            ) : null}
          </div>
        ) : null}

        {possuiFreteGratisPromocional ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
            <div className="flex items-center justify-between gap-3">
              <span>Frete grátis promocional</span>
              <strong className="font-semibold">
                -{formatarPrecoCarrinho(descontoFretePromocionalEmCentavos)}
              </strong>
            </div>
          </div>
        ) : null}

        <Separator />

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Total estimado
            </span>
            <strong className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              {formatarPrecoCarrinho(totalEstimadoEmCentavos)}
            </strong>
          </div>
          <p className="text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
            Estimativa visual do carrinho. O checkout ainda recalcula tudo no
            servidor.
          </p>
        </div>

        <div className="grid gap-2">
          <Button className="h-11 w-full rounded-md" asChild>
            <Link href="/checkout">Finalizar compra</Link>
          </Button>

          <Button
            className="h-11 w-full rounded-md"
            type="button"
            variant="outline"
            onClick={onContinuarComprando}
          >
            Continuar comprando
          </Button>
        </div>
      </div>
    </footer>
  );
}
