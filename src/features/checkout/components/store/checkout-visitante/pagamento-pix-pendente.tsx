"use client";

import { CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatarPrecoCarrinho } from "@/features/carrinho";

type PagamentoPixPendenteProps = {
  numeroPedido: string;
  totalEmCentavos: number;
  qrCode: string;
  copiaECola: string;
  expiresAt: string;
};

export function PagamentoPixPendente({
  numeroPedido,
  totalEmCentavos,
  qrCode,
  copiaECola,
  expiresAt,
}: PagamentoPixPendenteProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiarPix() {
    await navigator.clipboard.writeText(copiaECola);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center px-4 py-10">
      <section className="grid w-full gap-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-[320px_minmax(0,1fr)] md:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <img
            alt={`QR Code Pix do pedido ${numeroPedido}`}
            className="size-64 rounded-md bg-white p-3"
            src={qrCode}
          />
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Pix gerado
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Pedido {numeroPedido} criado com pagamento pendente. Pague com o QR
            Code ou copie o código Pix abaixo.
          </p>

          <div className="mt-5 grid gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400">Valor</span>
              <strong>{formatarPrecoCarrinho(totalEmCentavos)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400">Status</span>
              <strong className="text-amber-700 dark:text-amber-300">
                Pendente
              </strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500 dark:text-zinc-400">
                Expira em
              </span>
              <strong>{new Date(expiresAt).toLocaleTimeString("pt-BR")}</strong>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs leading-5 break-all text-zinc-600 dark:text-zinc-300">
              {copiaECola}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-11 rounded-md"
              type="button"
              onClick={copiarPix}
            >
              <Copy className="mr-2 size-4" />
              {copiado ? "Código copiado" : "Copiar Pix"}
            </Button>
            <Button className="h-11 rounded-md" variant="outline" asChild>
              <Link href="/">Voltar para a loja</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
