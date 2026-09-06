import type { PagamentoStatusCheckout } from "../../../types/pedidos-pagamentos.types";
import { resolverEstadoVisualPix } from "./estado-pix";

type ReferenciasPix = {
  transactionId: string | null;
  pixTxid: string | null;
  qrCode: string | null;
  copiaECola: string | null;
  expiresAt: Date | null;
};

export type DecisaoRetomadaPix =
  | "reutilizar"
  | "renovar"
  | "gerar_inicial"
  | "pagamento_confirmado"
  | "em_processamento"
  | "conciliar"
  | "indisponivel";

function objeto(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function providerIndicaGeracaoPixEmAndamento(providerResponse: unknown) {
  const controle = objeto(objeto(providerResponse)?.controlePix);
  return controle?.estado === "gerando";
}

export function obterGeracaoAtualPix(providerResponse: unknown) {
  const controleRaiz = objeto(objeto(providerResponse)?.controlePix);
  const respostaAtual = objeto(objeto(providerResponse)?.respostaAtual);
  const controleResposta = objeto(respostaAtual?.controlePix);
  const valor = controleRaiz?.geracao ?? controleResposta?.geracao;

  return typeof valor === "number" && Number.isInteger(valor) && valor >= 1
    ? valor
    : 1;
}

export function decidirRetomadaPix({
  statusPagamento,
  statusPedido,
  referencias,
  providerResponse,
  agora = new Date(),
}: {
  statusPagamento: PagamentoStatusCheckout;
  statusPedido: PagamentoStatusCheckout;
  referencias: ReferenciasPix;
  providerResponse: unknown;
  agora?: Date;
}): DecisaoRetomadaPix {
  if (statusPagamento === "paid" || statusPedido === "paid") {
    return "pagamento_confirmado";
  }

  const valores = Object.values(referencias);
  const possuiAlgumaReferencia = valores.some(Boolean);
  const possuiCobrancaCompleta = valores.every(Boolean);

  if (possuiCobrancaCompleta) {
    if (providerIndicaGeracaoPixEmAndamento(providerResponse)) {
      return "em_processamento";
    }

    const estado = resolverEstadoVisualPix({
      status: statusPagamento,
      expiresAt: referencias.expiresAt,
      agora,
    });

    if (estado === "aguardando_pagamento") return "reutilizar";
    if (estado === "expirado") return "renovar";
    return "conciliar";
  }

  if (possuiAlgumaReferencia) return "conciliar";

  if (statusPagamento === "failed" && statusPedido === "failed") {
    return "gerar_inicial";
  }

  return "indisponivel";
}

export type HistoricoCobrancaPix = {
  geracao: number;
  txid: string;
  expiresAt: string;
  substituidaEm: string;
  motivo: "expirada";
};

export function obterHistoricoCobrancasPix(
  providerResponse: unknown,
): HistoricoCobrancaPix[] {
  const historico = objeto(providerResponse)?.historicoCobrancasPix;
  if (!Array.isArray(historico)) return [];

  return historico.filter((item): item is HistoricoCobrancaPix => {
    const registro = objeto(item);
    return (
      typeof registro?.geracao === "number" &&
      typeof registro.txid === "string" &&
      typeof registro.expiresAt === "string" &&
      typeof registro.substituidaEm === "string" &&
      registro.motivo === "expirada"
    );
  });
}

export function montarProviderResponsePixRenovado({
  providerResponseAnterior,
  providerResponseNovo,
  txidAnterior,
  expiresAtAnterior,
  geracaoAnterior,
  geracaoNova,
  renovadoEm,
}: {
  providerResponseAnterior: unknown;
  providerResponseNovo: unknown;
  txidAnterior: string;
  expiresAtAnterior: Date;
  geracaoAnterior: number;
  geracaoNova: number;
  renovadoEm: Date;
}) {
  return {
    controlePix: {
      geracao: geracaoNova,
      estado: "ativa",
    },
    respostaAtual: providerResponseNovo,
    historicoCobrancasPix: [
      ...obterHistoricoCobrancasPix(providerResponseAnterior),
      {
        geracao: geracaoAnterior,
        txid: txidAnterior,
        expiresAt: expiresAtAnterior.toISOString(),
        substituidaEm: renovadoEm.toISOString(),
        motivo: "expirada" as const,
      },
    ],
  };
}
