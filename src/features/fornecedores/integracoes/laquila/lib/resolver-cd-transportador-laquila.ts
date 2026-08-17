import type { SnapshotGrupoEntrega } from "@/features/checkout/types/snapshot-frete.types";

import type { TransportadoraLaquila } from "./cliente-laquila";

const CODIGOS_TRANSPORTADORES_LAQUILA = {
  coletaPropria: "17487",
  correios: "17499",
  jadlog: "63993",
} as const;

type MarketplaceLaquila = "mercado_livre" | "shopee";

export type OperacaoColetaLaquila =
  | { tipo: "transportadora" }
  | { tipo: "coleta_propria_laquila" }
  | {
      tipo: "marketplace";
      marketplace: MarketplaceLaquila;
      codigoTransportador: string;
    };

export type ContextoResolucaoCdTransportadorLaquila = {
  /**
   * A operação é propositalmente separada da entrega ao consumidor. Sem esta
   * confirmação, uma entrega própria da loja jamais vira coleta própria Laquila.
   */
  operacaoColeta?: OperacaoColetaLaquila;
  contextoPedido?: "loja_propria" | MarketplaceLaquila;
};

export type ResultadoResolucaoCdTransportadorLaquila =
  | {
      estado: "resolvido";
      codigo: string;
      origemMapeamento:
        | "correios"
        | "jadlog"
        | "coleta_propria_laquila"
        | MarketplaceLaquila;
      confianca: "deterministica";
    }
  | {
      estado: "nao_aplicavel";
      codigo: null;
      motivo: "GRUPO_NAO_PERTENCE_A_LAQUILA";
    }
  | {
      estado: "nao_resolvido";
      codigo: null;
      motivo:
        | "OPERACAO_COLETA_LAQUILA_NAO_DEFINIDA"
        | "PROVEDOR_FRENET_NAO_CONFIRMADO"
        | "TRANSPORTADORA_LAQUILA_NAO_IDENTIFICADA"
        | "CODIGO_TRANSPORTADOR_AUSENTE_NO_00015";
    }
  | {
      estado: "bloqueado";
      codigo: null;
      motivo:
        | "MARKETPLACE_DIVERGENTE_DO_CONTEXTO_DO_PEDIDO"
        | "CODIGO_MARKETPLACE_NAO_INFORMADO"
        | "CEP_ORIGEM_LAQUILA_NAO_CONFIGURADO"
        | "CEP_ORIGEM_LAQUILA_DIVERGENTE";
    };

function normalizarIdentificador(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function codigoExisteNoCatalogo(
  codigo: string,
  transportadoras00015: readonly TransportadoraLaquila[],
) {
  return transportadoras00015.some(
    (transportadora) => transportadora.codigo.trim() === codigo,
  );
}

function resolverTransportadoraDoSnapshot(grupo: SnapshotGrupoEntrega) {
  // O ServiceCode da Frenet é a evidência mais estável disponível atualmente.
  const servicoId = normalizarIdentificador(grupo.entrega.servicoId);
  if (servicoId === "pac" || servicoId === "sedex") {
    return {
      codigo: CODIGOS_TRANSPORTADORES_LAQUILA.correios,
      origem: "correios",
    } as const;
  }

  // A Frenet não entrega Carrier ID no contrato atual. Os nomes aceitos ficam
  // centralizados e exatos para evitar comparações frágeis espalhadas pelo fluxo.
  const transportadora = normalizarIdentificador(grupo.entrega.transportadora);
  if (["correio", "correios", "correio pac sedex"].includes(transportadora)) {
    return {
      codigo: CODIGOS_TRANSPORTADORES_LAQUILA.correios,
      origem: "correios",
    } as const;
  }
  if (["jadlog", "jad log", "jad log coleta"].includes(transportadora)) {
    return {
      codigo: CODIGOS_TRANSPORTADORES_LAQUILA.jadlog,
      origem: "jadlog",
    } as const;
  }

  return null;
}

/**
 * Resolve apenas o futuro cd_transportador do contrato Laquila. Não consulta a
 * API e não produz efeitos colaterais; o chamador fornece o catálogo cacheado do
 * método 00015 e um contexto operacional previamente revalidado no servidor.
 */
export function resolverCdTransportadorLaquila({
  grupo,
  transportadoras00015,
  cepOrigemLaquilaEsperado,
  contexto = {},
}: {
  grupo: SnapshotGrupoEntrega;
  transportadoras00015: readonly TransportadoraLaquila[];
  cepOrigemLaquilaEsperado: string | null;
  contexto?: ContextoResolucaoCdTransportadorLaquila;
}): ResultadoResolucaoCdTransportadorLaquila {
  if (
    grupo.origemExpedicao !== "fornecedor" ||
    normalizarIdentificador(grupo.fornecedorProvedor) !== "laquila"
  ) {
    return {
      estado: "nao_aplicavel",
      codigo: null,
      motivo: "GRUPO_NAO_PERTENCE_A_LAQUILA",
    };
  }

  if (!cepOrigemLaquilaEsperado) {
    return {
      estado: "bloqueado",
      codigo: null,
      motivo: "CEP_ORIGEM_LAQUILA_NAO_CONFIGURADO",
    };
  }
  if (grupo.cepOrigem !== cepOrigemLaquilaEsperado) {
    return {
      estado: "bloqueado",
      codigo: null,
      motivo: "CEP_ORIGEM_LAQUILA_DIVERGENTE",
    };
  }

  const operacao = contexto.operacaoColeta;
  if (operacao?.tipo === "marketplace") {
    if (!operacao.codigoTransportador.trim()) {
      return {
        estado: "bloqueado",
        codigo: null,
        motivo: "CODIGO_MARKETPLACE_NAO_INFORMADO",
      };
    }
    if (contexto.contextoPedido !== operacao.marketplace) {
      return {
        estado: "bloqueado",
        codigo: null,
        motivo: "MARKETPLACE_DIVERGENTE_DO_CONTEXTO_DO_PEDIDO",
      };
    }

    const codigo = operacao.codigoTransportador.trim();
    if (!codigoExisteNoCatalogo(codigo, transportadoras00015)) {
      return {
        estado: "nao_resolvido",
        codigo: null,
        motivo: "CODIGO_TRANSPORTADOR_AUSENTE_NO_00015",
      };
    }
    return {
      estado: "resolvido",
      codigo,
      origemMapeamento: operacao.marketplace,
      confianca: "deterministica",
    };
  }

  if (operacao?.tipo === "coleta_propria_laquila") {
    const codigo = CODIGOS_TRANSPORTADORES_LAQUILA.coletaPropria;
    if (!codigoExisteNoCatalogo(codigo, transportadoras00015)) {
      return {
        estado: "nao_resolvido",
        codigo: null,
        motivo: "CODIGO_TRANSPORTADOR_AUSENTE_NO_00015",
      };
    }
    return {
      estado: "resolvido",
      codigo,
      origemMapeamento: "coleta_propria_laquila",
      confianca: "deterministica",
    };
  }

  if (
    operacao?.tipo === "transportadora" &&
    normalizarIdentificador(grupo.entrega.provedor) !== "frenet"
  ) {
    return {
      estado: "nao_resolvido",
      codigo: null,
      motivo: "PROVEDOR_FRENET_NAO_CONFIRMADO",
    };
  }

  const transportadoraResolvida = resolverTransportadoraDoSnapshot(grupo);
  if (transportadoraResolvida) {
    if (
      !codigoExisteNoCatalogo(
        transportadoraResolvida.codigo,
        transportadoras00015,
      )
    ) {
      return {
        estado: "nao_resolvido",
        codigo: null,
        motivo: "CODIGO_TRANSPORTADOR_AUSENTE_NO_00015",
      };
    }
    return {
      estado: "resolvido",
      codigo: transportadoraResolvida.codigo,
      origemMapeamento: transportadoraResolvida.origem,
      confianca: "deterministica",
    };
  }

  return {
    estado: "nao_resolvido",
    codigo: null,
    motivo:
      operacao === undefined
        ? "OPERACAO_COLETA_LAQUILA_NAO_DEFINIDA"
        : "TRANSPORTADORA_LAQUILA_NAO_IDENTIFICADA",
  };
}
