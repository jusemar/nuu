import "server-only";

import { db } from "@/db/connection";
import { fornecedorIntegracaoLogsTable } from "@/db/schema";

import { removerSegredosResumoLaquila } from "./mascarar-segredos-laquila";

type ValorResumoLog = string | number | boolean | null;
type ResumoLog = Record<string, ValorResumoLog>;

type EntradaRegistrarLogIntegracaoFornecedorApi = {
  integracaoApiId: string;
  metodo: string;
  operacao: string;
  status: "sucesso" | "erro";
  codigoHttp?: number | null;
  mensagem?: string | null;
  requestResumo?: Record<string, unknown> | null;
  responseResumo?: Record<string, unknown> | null;
};

const TAMANHO_MAXIMO_RESUMO = 8000;
const TAMANHO_MAXIMO_TEXTO = 1000;
const TOTAL_MAXIMO_ITENS_ARRAY = 20;

const chavesPayloadBruto = new Set([
  "payload",
  "payload_bruto",
  "request_bruto",
  "response_bruto",
  "resposta_bruta",
  "dados_brutos",
  "raw",
  "raw_request",
  "raw_response",
]);

function normalizarChave(chave: string) {
  return chave.replace(/[\s-]/g, "_").toLowerCase();
}

function limitarTexto(valor: string) {
  if (valor.length <= TAMANHO_MAXIMO_TEXTO) return valor;

  return `${valor.slice(0, TAMANHO_MAXIMO_TEXTO)}...[truncado]`;
}

function resumirValor(valor: unknown): unknown {
  if (typeof valor === "string") return limitarTexto(valor);
  if (
    typeof valor === "number" ||
    typeof valor === "boolean" ||
    valor === null
  ) {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor
      .slice(0, TOTAL_MAXIMO_ITENS_ARRAY)
      .map((item) => resumirValor(item));
  }

  if (valor && typeof valor === "object") {
    return resumirObjeto(valor as Record<string, unknown>);
  }

  return String(valor);
}

function resumirObjeto(valor: Record<string, unknown>) {
  const semSegredos = removerSegredosResumoLaquila(valor);
  const resumo: Record<string, unknown> = {};

  for (const [chave, item] of Object.entries(semSegredos)) {
    const chaveNormalizada = normalizarChave(chave);

    if (chavesPayloadBruto.has(chaveNormalizada)) {
      resumo[chave] = "[payload bruto removido]";
      continue;
    }

    resumo[chave] = resumirValor(item);
  }

  return resumo;
}

function limitarTamanhoResumo(
  valor: Record<string, unknown> | null | undefined,
) {
  const resumo = resumirObjeto(valor ?? {});
  const texto = JSON.stringify(resumo);

  if (texto.length <= TAMANHO_MAXIMO_RESUMO) {
    return resumo as ResumoLog;
  }

  return {
    resumo: texto.slice(0, TAMANHO_MAXIMO_RESUMO),
    truncado: true,
  };
}

export async function registrarLogIntegracaoFornecedorApi({
  integracaoApiId,
  metodo,
  operacao,
  status,
  codigoHttp = null,
  mensagem = null,
  requestResumo = null,
  responseResumo = null,
}: EntradaRegistrarLogIntegracaoFornecedorApi) {
  await db.insert(fornecedorIntegracaoLogsTable).values({
    integracaoApiId,
    metodo,
    operacao,
    status,
    codigoHttp,
    mensagem: mensagem ? limitarTexto(mensagem) : null,
    requestResumo: limitarTamanhoResumo(requestResumo),
    responseResumo: limitarTamanhoResumo(responseResumo),
  });
}
