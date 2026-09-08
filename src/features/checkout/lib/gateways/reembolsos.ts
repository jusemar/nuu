import "server-only";

import { createHash } from "node:crypto";

import { consultarCobrancaPixEfi } from "./efi/pix-efi";
import { chamarApiPixEfi } from "./efi/cliente-efi";
import { obterStripe } from "./stripe/cliente-stripe";

type EntradaReembolso = {
  gateway: "stripe" | "efibank";
  transactionId: string | null;
  pixTxid: string | null;
  valorEmCentavos: number;
  chaveIdempotencia: string;
  pedidoId: string;
};

type RespostaDevolucaoEfi = {
  id: string;
  status: "EM_PROCESSAMENTO" | "DEVOLVIDO" | "NAO_REALIZADO";
};

function idDevolucaoEfi(chave: string) {
  return createHash("sha256").update(chave).digest("hex").slice(0, 32);
}

/** Porta única de reembolso. Cada adaptador preserva a mesma chave em todos os retries. */
export async function reembolsarPagamento(entrada: EntradaReembolso) {
  if (entrada.gateway === "stripe") {
    if (!entrada.transactionId?.startsWith("pi_"))
      throw new Error("PaymentIntent Stripe não disponível para reembolso.");
    const reembolso = await obterStripe().refunds.create(
      {
        payment_intent: entrada.transactionId,
        reason: "requested_by_customer",
        metadata: { pedidoId: entrada.pedidoId },
      },
      { idempotencyKey: entrada.chaveIdempotencia },
    );
    if (reembolso.status === "failed" || reembolso.status === "canceled")
      throw new Error("Stripe recusou o reembolso.");
    return {
      id: reembolso.id,
      status:
        reembolso.status === "succeeded"
          ? ("concluido" as const)
          : ("processando" as const),
    };
  }

  if (!entrada.pixTxid)
    throw new Error("txid Pix não disponível para devolução.");
  const cobranca = await consultarCobrancaPixEfi(entrada.pixTxid);
  const e2eId = cobranca.pix?.find(
    (pix) => pix.endToEndId && !pix.devolucoes?.length,
  )?.endToEndId;
  if (!e2eId)
    throw new Error(
      "Identificador da transação Pix não disponível para devolução.",
    );
  const id = idDevolucaoEfi(entrada.chaveIdempotencia);
  const devolucao = await chamarApiPixEfi<RespostaDevolucaoEfi>({
    metodo: "PUT",
    path: `/v2/pix/${encodeURIComponent(e2eId)}/devolucao/${id}`,
    body: { valor: (entrada.valorEmCentavos / 100).toFixed(2) },
  });
  if (devolucao.status === "NAO_REALIZADO")
    throw new Error("Efí não realizou a devolução Pix.");
  return {
    id: devolucao.id,
    status:
      devolucao.status === "DEVOLVIDO"
        ? ("concluido" as const)
        : ("processando" as const),
  };
}

/** Inutiliza a cobrança ainda aberta quando o PSP oferece essa operação. */
export async function cancelarCobrancaPendente(entrada: {
  gateway: "stripe" | "efibank" | "manual";
  transactionId: string | null;
  pixTxid: string | null;
}) {
  if (
    entrada.gateway === "stripe" &&
    entrada.transactionId?.startsWith("cs_")
  ) {
    await obterStripe().checkout.sessions.expire(entrada.transactionId);
    return;
  }
  if (entrada.gateway === "efibank" && entrada.pixTxid) {
    await chamarApiPixEfi({
      metodo: "PATCH",
      path: `/v2/cob/${encodeURIComponent(entrada.pixTxid)}`,
      body: { status: "REMOVIDA_PELO_USUARIO_RECEBEDOR" },
    });
  }
}
