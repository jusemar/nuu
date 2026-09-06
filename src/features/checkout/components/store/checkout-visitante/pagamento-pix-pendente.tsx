import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { PagamentoStatusCheckout } from "../../../types/pedidos-pagamentos.types";
import { PainelCobrancaPix } from "../pedidos-cliente/painel-cobranca-pix";

type PagamentoPixPendenteProps = {
  numeroPedido: string;
  totalEmCentavos: number;
  qrCode: string | null;
  copiaECola: string | null;
  expiresAt: string | null;
  pedidoId?: string;
  status?: PagamentoStatusCheckout;
  createdAt?: string | null;
  paidAt?: string | null;
  agoraInicial?: string;
};

export function PagamentoPixPendente({
  numeroPedido,
  totalEmCentavos,
  qrCode,
  copiaECola,
  expiresAt,
  pedidoId,
  status = "pending",
  createdAt,
  paidAt,
  agoraInicial,
}: PagamentoPixPendenteProps) {
  return (
    <main className="mx-auto min-h-[80vh] max-w-3xl px-4 py-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
        <PainelCobrancaPix
          pedidoId={pedidoId}
          numeroPedido={numeroPedido}
          totalEmCentavos={totalEmCentavos}
          status={status}
          qrCode={qrCode}
          copiaECola={copiaECola}
          expiresAt={expiresAt}
          createdAt={createdAt}
          paidAt={paidAt}
          agoraInicial={agoraInicial}
          acompanharPagamento={Boolean(pedidoId)}
        />
        <div className="mt-6 border-t pt-5">
          <Button className="h-11 rounded-md" variant="outline" asChild>
            <Link href={pedidoId ? `/minha-conta/pedidos/${pedidoId}` : "/"}>
              <ArrowLeft className="mr-2 size-4" />
              {pedidoId ? "Voltar ao pedido" : "Voltar para a loja"}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
