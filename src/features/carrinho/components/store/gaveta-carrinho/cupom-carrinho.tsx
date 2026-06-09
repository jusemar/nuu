"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, TicketPercent, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calcularPreviaTotaisPedido,
  type ResultadoCalcularPreviaTotaisPedido,
} from "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido";
import { CHAVE_STORAGE_CUPOM_CARRINHO } from "@/features/promocoes/constants/cupom-carrinho-storage";
import type { ResultadoValidarCupomPromocao } from "@/features/promocoes/services";

import type { ItemCarrinho } from "../../../types/carrinho.types";
import { formatarPrecoCarrinho } from "../../../lib/formatar-preco-carrinho";

type CupomCarrinhoProps = {
  itens: ItemCarrinho[];
  subtotalEmCentavos: number;
  onResultadoCupom: (resultado: ResultadoValidarCupomPromocao | null) => void;
  onPreviaTotais: (
    resultado: ResultadoCalcularPreviaTotaisPedido | null,
  ) => void;
};

type CupomPersistido = {
  codigo: string;
  subtotalValidadoEmCentavos: number;
  resultado: ResultadoValidarCupomPromocao | null;
};

function lerCupomPersistido(): CupomPersistido | null {
  if (typeof window === "undefined") return null;

  try {
    const valor = window.localStorage.getItem(CHAVE_STORAGE_CUPOM_CARRINHO);
    return valor ? (JSON.parse(valor) as CupomPersistido) : null;
  } catch {
    return null;
  }
}

function persistirCupom(cupom: CupomPersistido | null) {
  if (typeof window === "undefined") return;

  if (!cupom) {
    window.localStorage.removeItem(CHAVE_STORAGE_CUPOM_CARRINHO);
    return;
  }

  window.localStorage.setItem(
    CHAVE_STORAGE_CUPOM_CARRINHO,
    JSON.stringify(cupom),
  );
}

export function CupomCarrinho({
  itens,
  subtotalEmCentavos,
  onResultadoCupom,
  onPreviaTotais,
}: CupomCarrinhoProps) {
  const [codigoCupom, setCodigoCupom] = useState("");
  const [resultado, setResultado] =
    useState<ResultadoValidarCupomPromocao | null>(null);
  const [isPending, startTransition] = useTransition();

  const codigoNormalizado = useMemo(
    () => codigoCupom.trim().toUpperCase(),
    [codigoCupom],
  );

  useEffect(() => {
    const cupomPersistido = lerCupomPersistido();

    if (!cupomPersistido) return;

    setCodigoCupom(cupomPersistido.codigo);
    if (cupomPersistido.subtotalValidadoEmCentavos === subtotalEmCentavos) {
      setResultado(cupomPersistido.resultado);
      onResultadoCupom(cupomPersistido.resultado);
      return;
    }

    startTransition(async () => {
      const previa = await calcularPreviaTotaisPedido({
        itens,
        codigoCupom: cupomPersistido.codigo,
      });
      const validacao = previa?.cupom ?? null;

      setResultado(validacao);
      onResultadoCupom(validacao);
      onPreviaTotais(previa);
      persistirCupom({
        codigo: cupomPersistido.codigo,
        subtotalValidadoEmCentavos: subtotalEmCentavos,
        resultado: validacao,
      });
    });
  }, [onResultadoCupom, subtotalEmCentavos]);

  function aplicarCupom() {
    if (!codigoNormalizado) {
      const resultadoInvalido: ResultadoValidarCupomPromocao = {
        valido: false,
        codigo: "",
        mensagem: "Informe um cupom para validar.",
        tipoDesconto: null,
        valorDesconto: 0,
        descontoEstimadoEmCentavos: 0,
        motivoInvalido: "codigo_invalido",
      };
      setResultado(resultadoInvalido);
      onResultadoCupom(resultadoInvalido);
      onPreviaTotais(null);
      persistirCupom(null);
      return;
    }

    startTransition(async () => {
      const previa = await calcularPreviaTotaisPedido({
        itens,
        codigoCupom: codigoNormalizado,
      });
      const validacao = previa?.cupom ?? null;

      setResultado(validacao);
      onResultadoCupom(validacao);
      onPreviaTotais(previa);
      persistirCupom({
        codigo: codigoNormalizado,
        subtotalValidadoEmCentavos: subtotalEmCentavos,
        resultado: validacao,
      });
    });
  }

  function removerCupom() {
    setCodigoCupom("");
    setResultado(null);
    onResultadoCupom(null);
    onPreviaTotais(null);
    persistirCupom(null);
  }

  const possuiCupomInformado = Boolean(codigoCupom.trim() || resultado);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        <TicketPercent className="size-4 text-emerald-600" />
        Cupom promocional
      </div>

      <div className="flex gap-2">
        <Input
          value={codigoCupom}
          onChange={(event) => setCodigoCupom(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              aplicarCupom();
            }
          }}
          placeholder="Digite seu cupom"
          className="h-10 bg-white text-sm uppercase dark:bg-zinc-950"
          disabled={isPending}
        />
        <Button
          type="button"
          className="h-10 px-3"
          onClick={aplicarCupom}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
        </Button>
        {possuiCupomInformado ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 px-3"
            onClick={removerCupom}
            disabled={isPending}
          >
            Remover
          </Button>
        ) : null}
      </div>

      {isPending ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Validando cupom no servidor...
        </p>
      ) : null}

      {resultado ? (
        <div
          className={`mt-3 rounded-xl border p-3 text-xs ${
            resultado.valido
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100"
          }`}
        >
          <div className="flex items-start gap-2">
            {resultado.valido ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{resultado.mensagem}</p>
              {resultado.valido ? (
                <div className="mt-1 space-y-0.5">
                  <p>Código aplicado: {resultado.codigo}</p>
                  <p>
                    Economia estimada:{" "}
                    {formatarPrecoCarrinho(
                      resultado.descontoEstimadoEmCentavos,
                    )}
                    .
                  </p>
                </div>
              ) : null}
              {resultado.motivoInvalido === "subtotal_insuficiente" ? (
                <p className="mt-1">Este cupom exige subtotal mínimo maior.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-2 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
        Nesta etapa o cupom altera apenas o resumo estimado do carrinho.
      </p>
    </div>
  );
}
