import "server-only";

import type { SnapshotGrupoEntrega } from "@/features/checkout/types/snapshot-frete.types";
import { obterCepOrigemLaquila } from "@/features/logistica/lib/origens/obter-cep-origem-laquila";

import { montarContextoTransportadorLaquila } from "../lib/montar-contexto-transportador-laquila";
import { resolverCdTransportadorLaquila } from "../lib/resolver-cd-transportador-laquila";
import { listarTransportadorasLaquila } from "./listar-transportadoras-laquila";

/**
 * Única porta preparatória para o futuro 00002. A entrada é exclusivamente o
 * grupo do snapshot v2 reconstruído no servidor; não aceita carrier ou código
 * enviados separadamente pelo navegador.
 */
export async function prepararContextoTransportadorLaquila(
  grupo: SnapshotGrupoEntrega,
) {
  const cepOrigemLaquila = obterCepOrigemLaquila();
  const validacaoPrevia = resolverCdTransportadorLaquila({
    grupo,
    transportadoras00015: [],
    cepOrigemLaquilaEsperado: cepOrigemLaquila,
    contexto: {
      contextoPedido: "loja_propria",
      operacaoColeta: { tipo: "transportadora" },
    },
  });

  if (
    validacaoPrevia.estado === "nao_aplicavel" ||
    validacaoPrevia.estado === "bloqueado" ||
    (validacaoPrevia.estado === "nao_resolvido" &&
      (validacaoPrevia.motivo === "PROVEDOR_FRENET_NAO_CONFIRMADO" ||
        validacaoPrevia.motivo === "TRANSPORTADORA_LAQUILA_NAO_IDENTIFICADA"))
  ) {
    return validacaoPrevia;
  }

  const catalogo = await listarTransportadorasLaquila();
  if (catalogo.situacao === "erro") {
    return {
      estado: "nao_resolvido" as const,
      codigo: null,
      motivo: "CATALOGO_TRANSPORTADORAS_00015_INDISPONIVEL" as const,
    };
  }

  const resolucao = resolverCdTransportadorLaquila({
    grupo,
    transportadoras00015: catalogo.transportadoras,
    cepOrigemLaquilaEsperado: cepOrigemLaquila,
    contexto: {
      contextoPedido: "loja_propria",
      operacaoColeta: { tipo: "transportadora" },
    },
  });

  return montarContextoTransportadorLaquila(grupo, resolucao);
}
