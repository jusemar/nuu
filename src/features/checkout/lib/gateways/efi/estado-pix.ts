import type { PagamentoStatusCheckout } from "../../../types/pedidos-pagamentos.types";

export type EstadoVisualPix =
  | "aguardando_pagamento"
  | "expirado"
  | "pago"
  | "falhou";

export function resolverEstadoVisualPix({
  status,
  expiresAt,
  agora = new Date(),
}: {
  status: PagamentoStatusCheckout;
  expiresAt: Date | string | null;
  agora?: Date;
}): EstadoVisualPix {
  if (status === "paid") return "pago";
  if (status === "failed") return "falhou";
  if (status === "expired") return "expirado";

  if (expiresAt && new Date(expiresAt).getTime() <= agora.getTime()) {
    return "expirado";
  }

  return "aguardando_pagamento";
}

export const ESTADO_VISUAL_PIX_LABEL: Record<EstadoVisualPix, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  expirado: "Pix expirado",
  pago: "Pago",
  falhou: "Falhou",
};

export function pixEstaValidoParaPagamento({
  status,
  expiresAt,
  agora = new Date(),
}: {
  status: PagamentoStatusCheckout;
  expiresAt: Date | string | null;
  agora?: Date;
}) {
  return (
    resolverEstadoVisualPix({ status, expiresAt, agora }) ===
    "aguardando_pagamento"
  );
}
