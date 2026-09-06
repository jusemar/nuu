"use client";

import {
  CheckCircle2,
  Clock3,
  Copy,
  LoaderCircle,
  QrCode,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { formatarPrecoCarrinho } from "@/features/carrinho";

import {
  retomarPagamentoPixPedidoCliente,
  sincronizarPagamentoPixPedidoCliente,
} from "../../../actions/pedido/criar-pedido-checkout-visitante";
import {
  ESTADO_VISUAL_PIX_LABEL,
  resolverEstadoVisualPix,
} from "../../../lib/gateways/efi/estado-pix";
import type { PagamentoStatusCheckout } from "../../../types/pedidos-pagamentos.types";

type PainelCobrancaPixProps = {
  pedidoId?: string;
  numeroPedido: string;
  totalEmCentavos: number;
  status: PagamentoStatusCheckout;
  qrCode: string | null;
  copiaECola: string | null;
  expiresAt: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
  txid?: string | null;
  exibirDadosOperacionais?: boolean;
  acompanharPagamento?: boolean;
  agoraInicial?: string;
};

function formatarDuracao(tempoEmMilissegundos: number) {
  const totalSegundos = Math.max(0, Math.floor(tempoEmMilissegundos / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  return [horas, minutos, segundos]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
}

function formatarDataHora(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(data));
}

export function PainelCobrancaPix({
  pedidoId,
  numeroPedido,
  totalEmCentavos,
  status,
  qrCode,
  copiaECola,
  expiresAt,
  createdAt,
  paidAt,
  txid,
  exibirDadosOperacionais = false,
  acompanharPagamento = false,
  agoraInicial,
}: PainelCobrancaPixProps) {
  const router = useRouter();
  const [agora, setAgora] = useState<number | null>(() =>
    agoraInicial ? new Date(agoraInicial).getTime() : null,
  );
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, iniciarTransicao] = useTransition();
  const consultaEmAndamento = useRef(false);
  const estado = resolverEstadoVisualPix({
    status,
    expiresAt,
    agora: new Date(agora ?? 0),
  });
  const aguardando = estado === "aguardando_pagamento";
  const expirado = estado === "expirado";
  const pago = estado === "pago";
  const possuiCobranca = Boolean(qrCode && copiaECola && expiresAt);

  useEffect(() => {
    setAgora(Date.now());
    const interval = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!acompanharPagamento || !pedidoId || !aguardando) return;

    const interval = window.setInterval(() => {
      if (consultaEmAndamento.current) return;
      consultaEmAndamento.current = true;
      void sincronizarPagamentoPixPedidoCliente({ pedidoId })
        .then((resultado) => {
          if (resultado.confirmado) router.refresh();
        })
        .catch(() => undefined)
        .finally(() => {
          consultaEmAndamento.current = false;
        });
    }, 20_000);

    return () => window.clearInterval(interval);
  }, [acompanharPagamento, aguardando, pedidoId, router]);

  async function copiarCodigoPix() {
    if (!copiaECola || !aguardando) return;
    try {
      await navigator.clipboard.writeText(copiaECola);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione o código Pix.");
    }
  }

  function gerarNovoPix() {
    if (!pedidoId || processando) return;
    setErro(null);
    iniciarTransicao(async () => {
      try {
        await retomarPagamentoPixPedidoCliente({ pedidoId });
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível gerar um novo Pix.",
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            pago
              ? "bg-emerald-50 text-emerald-700"
              : expirado || estado === "falhou"
                ? "bg-rose-50 text-rose-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {pago ? (
            <CheckCircle2 className="size-6" />
          ) : expirado || estado === "falhou" ? (
            <TriangleAlert className="size-6" />
          ) : (
            <QrCode className="size-6" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            {pago ? "Pagamento confirmado" : "Pagamento via Pix"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {pago
              ? "O pagamento deste pedido foi confirmado pela Efí."
              : expirado
                ? "O prazo para pagamento deste Pix terminou."
                : estado === "falhou"
                  ? "A cobrança Pix não pôde ser processada."
                  : "Pague pelo QR Code ou copie o código abaixo."}
          </p>
        </div>
      </div>

      <dl className="grid gap-3 rounded-lg border bg-zinc-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Pedido</dt>
          <dd className="mt-1 font-semibold text-zinc-950">{numeroPedido}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Valor</dt>
          <dd className="mt-1 font-semibold text-zinc-950">
            {formatarPrecoCarrinho(totalEmCentavos)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="mt-1 font-semibold text-zinc-950">
            {ESTADO_VISUAL_PIX_LABEL[estado]}
          </dd>
        </div>
        {createdAt ? (
          <div>
            <dt className="text-zinc-500">Criado em</dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {formatarDataHora(createdAt)}
            </dd>
          </div>
        ) : null}
        {expiresAt ? (
          <div>
            <dt className="text-zinc-500">
              {expirado ? "Expirou em" : "Válido até"}
            </dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {formatarDataHora(expiresAt)}
            </dd>
          </div>
        ) : null}
        {pago && paidAt ? (
          <div>
            <dt className="text-zinc-500">Pago em</dt>
            <dd className="mt-1 font-semibold text-zinc-950">
              {formatarDataHora(paidAt)}
            </dd>
          </div>
        ) : null}
        {exibirDadosOperacionais ? (
          <>
            <div>
              <dt className="text-zinc-500">Gateway</dt>
              <dd className="mt-1 font-semibold text-zinc-950">Efí</dd>
            </div>
            {txid ? (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-zinc-500">Pix txid</dt>
                <dd className="mt-1 font-mono text-xs break-all text-zinc-950">
                  {txid}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>

      {aguardando && possuiCobranca ? (
        <>
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-zinc-50 p-4">
            <Image
              alt={`QR Code Pix do pedido ${numeroPedido}`}
              className="size-56 max-w-full rounded-md bg-white p-3"
              src={qrCode!}
              width={224}
              height={224}
              unoptimized
            />
            {agora !== null && expiresAt ? (
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <Clock3 className="size-4" />
                Este Pix expira em{" "}
                {formatarDuracao(new Date(expiresAt).getTime() - agora)}
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">
              Pix Copia e Cola
            </p>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <p className="text-xs leading-5 break-all text-zinc-700">
                {copiaECola}
              </p>
            </div>
            <Button
              className="mt-3 w-full"
              type="button"
              onClick={copiarCodigoPix}
            >
              <Copy className="mr-2 size-4" />
              {copiado ? "Código Pix copiado" : "Copiar código Pix"}
            </Button>
          </div>
        </>
      ) : null}

      {(expirado || estado === "falhou") && pedidoId ? (
        <Button
          className="w-full"
          type="button"
          disabled={processando}
          onClick={gerarNovoPix}
        >
          {processando ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          ) : (
            <QrCode className="mr-2 size-4" />
          )}
          {processando
            ? "Gerando novo Pix..."
            : expirado
              ? "Gerar novo Pix"
              : "Gerar Pix deste pedido"}
        </Button>
      ) : null}

      {erro ? (
        <p className="text-sm text-rose-700" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
