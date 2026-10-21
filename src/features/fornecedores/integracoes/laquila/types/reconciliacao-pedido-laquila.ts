import type { SincronizacaoPedidoLaquila } from "../lib/reconciliacao/estado-pedido-laquila";

/** Projeção administrativa; nunca contém credenciais ou o payload de criação. */
export type IntegracaoPedidoLaquilaAdmin = {
  id: string;
  ambiente: string;
  status: string;
  idPedidoExterno: string | null;
  ultimaConsulta: string | null;
  sincronizacao: SincronizacaoPedidoLaquila | null;
};
