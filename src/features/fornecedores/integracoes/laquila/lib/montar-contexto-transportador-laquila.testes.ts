import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { SnapshotGrupoEntrega } from "@/features/checkout/types/snapshot-frete.types";

import { montarContextoTransportadorLaquila } from "./montar-contexto-transportador-laquila";

const grupo = {
  chaveGrupo: "expedicao:fornecedor:laquila",
  cepOrigem: "83430000",
  origemExpedicao: "fornecedor",
  fornecedorProvedor: "laquila",
  necessitaEtiquetaFornecedor: true,
  itens: [],
  entrega: {
    identificadorOpcao: "frenet:cotacao:SEDEX",
    tipo: "entrega",
    provedor: "frenet",
    servicoId: "SEDEX",
    servicoNome: "SEDEX",
    transportadora: "Correios",
    valorEmCentavos: 1990,
    prazo: "3 dias úteis",
    metadadosRelevantes: { transportadora: "Correios" },
  },
} satisfies SnapshotGrupoEntrega;

descrever("contexto operacional do transportador Laquila", () => {
  verificar("preserva os dados Frenet reais e o código resolvido", () => {
    const contexto = montarContextoTransportadorLaquila(grupo, {
      estado: "resolvido",
      codigo: "17499",
      origemMapeamento: "correios",
      confianca: "deterministica",
    });

    afirmacoes.deepEqual(contexto, {
      estado: "resolvido",
      grupo: {
        chave: "expedicao:fornecedor:laquila",
        origemExpedicao: "fornecedor",
        fornecedorProvedor: "laquila",
        cepOrigem: "83430000",
      },
      transportadoraFrenet: {
        provedor: "frenet",
        carrier: "Correios",
        serviceCode: "SEDEX",
        serviceName: "SEDEX",
      },
      cdTransportadorLaquila: "17499",
      origemMapeamento: "correios",
      confianca: "deterministica",
    });
  });

  verificar("não transforma resultado desconhecido em contexto apto", () => {
    const resolucao = {
      estado: "nao_resolvido" as const,
      codigo: null,
      motivo: "TRANSPORTADORA_LAQUILA_NAO_IDENTIFICADA" as const,
    };
    afirmacoes.equal(
      montarContextoTransportadorLaquila(grupo, resolucao),
      resolucao,
    );
  });
});
