"use client";

import { LoaderCircle, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { retomarPagamentoPixPedidoCliente } from "../../../actions/pedido/criar-pedido-checkout-visitante";

export function BotaoRetomarPagamentoPix({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [processando, iniciarTransicao] = useTransition();

  function retomarPagamento() {
    setErro(null);
    iniciarTransicao(async () => {
      try {
        await retomarPagamentoPixPedidoCliente({ pedidoId });
        router.push(`/minha-conta/pedidos/${pedidoId}/pix`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o Pix deste pedido.",
        );
      }
    });
  }

  return (
    <div className="mt-4 border-t pt-4">
      <Button
        className="w-full"
        type="button"
        disabled={processando}
        onClick={retomarPagamento}
      >
        {processando ? (
          <LoaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <QrCode className="mr-2 size-4" />
        )}
        {processando ? "Gerando Pix..." : "Gerar Pix deste pedido"}
      </Button>
      {erro ? (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
