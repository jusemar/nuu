import "server-only";

import type { AmbienteLaquila } from "../lib/ambiente-laquila";
import {
  consultarTransportadorasLaquila,
  criarClienteLaquila,
  type TransportadoraLaquila,
} from "../lib/cliente-laquila";
import type { ConfiguracaoLaquilaAdmin } from "../types";
import { buscarConfiguracaoLaquilaAdmin } from "./buscar-configuracao-laquila";

const DURACAO_CACHE_TRANSPORTADORAS_LAQUILA_MS = 5 * 60 * 1000;

export type ResultadoListaTransportadorasLaquila =
  | {
      situacao: "sucesso";
      transportadoras: TransportadoraLaquila[];
    }
  | {
      situacao: "erro";
      mensagem: string;
    };

declare global {
  var __cacheTransportadorasLaquila:
    | {
        integracaoId: string;
        ambiente: AmbienteLaquila;
        expiraEm: number;
        resultado: ResultadoListaTransportadorasLaquila;
      }
    | undefined;
  var __consultaTransportadorasLaquila:
    | Partial<
        Record<AmbienteLaquila, Promise<ResultadoListaTransportadorasLaquila>>
      >
    | undefined;
}

async function consultarTransportadorasSemCache(
  configuracao: ConfiguracaoLaquilaAdmin | null,
): Promise<ResultadoListaTransportadorasLaquila> {
  if (!configuracao?.ativo || !configuracao.tokenCliente) {
    return {
      situacao: "erro",
      mensagem:
        "Não foi possível consultar as transportadoras da Laquila no momento.",
    };
  }

  const resultado = await consultarTransportadorasLaquila({
    cliente: criarClienteLaquila({
      id: configuracao.id,
      ambiente: configuracao.ambiente,
      urlBase: configuracao.urlBase,
      cnpjEmpresa: configuracao.cnpjEmpresa,
      // O cliente não usa o valor criptografado durante a chamada. O token
      // descriptografado segue separado e permanece somente no servidor.
      tokenClienteCriptografado: null,
    }),
    tokenCliente: configuracao.tokenCliente,
  });

  if (!resultado.sucesso) {
    return {
      situacao: "erro",
      mensagem:
        "Não foi possível consultar as transportadoras da Laquila no momento.",
    };
  }

  return {
    situacao: "sucesso",
    transportadoras: resultado.transportadoras,
  };
}

/**
 * Mantém a API como fonte e evita repetir o método 00015 entre renderizações.
 * Falhas não entram no cache para permitir recuperação na próxima abertura.
 */
export async function listarTransportadorasLaquila(ambiente: AmbienteLaquila) {
  const configuracao = await buscarConfiguracaoLaquilaAdmin({ ambiente });
  const cache = globalThis.__cacheTransportadorasLaquila;

  if (
    configuracao &&
    cache?.integracaoId === configuracao.id &&
    cache.ambiente === ambiente &&
    cache.expiraEm > Date.now()
  ) {
    return cache.resultado;
  }

  globalThis.__consultaTransportadorasLaquila ??= {};
  globalThis.__consultaTransportadorasLaquila[ambiente] ??=
    consultarTransportadorasSemCache(configuracao);

  try {
    const resultado =
      await globalThis.__consultaTransportadorasLaquila[ambiente];

    if (configuracao && resultado.situacao === "sucesso") {
      globalThis.__cacheTransportadorasLaquila = {
        integracaoId: configuracao.id,
        ambiente,
        expiraEm: Date.now() + DURACAO_CACHE_TRANSPORTADORAS_LAQUILA_MS,
        resultado,
      };
    }

    return resultado;
  } finally {
    delete globalThis.__consultaTransportadorasLaquila[ambiente];
  }
}
