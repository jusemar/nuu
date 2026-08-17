import type { SnapshotGrupoEntrega } from "@/features/checkout/types/snapshot-frete.types";

import type { ResultadoResolucaoCdTransportadorLaquila } from "./resolver-cd-transportador-laquila";

export type ContextoTransportadorLaquilaResolvido = {
  estado: "resolvido";
  grupo: {
    chave: string;
    origemExpedicao: "fornecedor";
    fornecedorProvedor: "laquila";
    cepOrigem: string;
  };
  transportadoraFrenet: {
    provedor: "frenet";
    carrier: string | null;
    serviceCode: string;
    serviceName: string;
  };
  cdTransportadorLaquila: string;
  origemMapeamento: "correios" | "jadlog";
  confianca: "deterministica";
};

/**
 * Congela o contexto derivado do snapshot revalidado para a futura montagem do
 * pedido externo, sem persistir nem executar qualquer operação na Laquila.
 */
export function montarContextoTransportadorLaquila(
  grupo: SnapshotGrupoEntrega,
  resolucao: ResultadoResolucaoCdTransportadorLaquila,
):
  | ContextoTransportadorLaquilaResolvido
  | ResultadoResolucaoCdTransportadorLaquila {
  if (
    resolucao.estado !== "resolvido" ||
    (resolucao.origemMapeamento !== "correios" &&
      resolucao.origemMapeamento !== "jadlog")
  ) {
    return resolucao;
  }

  return {
    estado: "resolvido",
    grupo: {
      chave: grupo.chaveGrupo,
      origemExpedicao: "fornecedor",
      fornecedorProvedor: "laquila",
      cepOrigem: grupo.cepOrigem!,
    },
    transportadoraFrenet: {
      provedor: "frenet",
      carrier: grupo.entrega.transportadora,
      serviceCode: grupo.entrega.servicoId,
      serviceName: grupo.entrega.servicoNome,
    },
    cdTransportadorLaquila: resolucao.codigo,
    origemMapeamento: resolucao.origemMapeamento,
    confianca: resolucao.confianca,
  };
}
