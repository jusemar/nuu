import "server-only";

import { asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  fornecedoresTable,
  importacoesFornecedorTable,
} from "@/db/schema";

import type { FornecedorComResumoImportacoes } from "../types/fornecedores.types";

type ErroComCausa = Error & {
  code?: string;
  cause?: {
    name?: string;
    code?: string;
    message?: string;
    sourceError?: {
      name?: string;
      code?: string;
      message?: string;
      cause?: {
        name?: string;
        code?: string;
        message?: string;
      };
    };
  };
};

function obterDetalhesErroBanco(erro: unknown) {
  if (!(erro instanceof Error)) {
    return {
      mensagem: "Erro desconhecido.",
      codigo: undefined,
      causa: undefined,
      nomeCausa: undefined,
    };
  }

  const erroComCausa = erro as ErroComCausa;

  return {
    mensagem: erro.message.replace(/params:[\s\S]*/i, "params: [removido]"),
    codigo:
      erroComCausa.code ??
      erroComCausa.cause?.code ??
      erroComCausa.cause?.sourceError?.code ??
      erroComCausa.cause?.sourceError?.cause?.code,
    causa:
      erroComCausa.cause?.message ??
      erroComCausa.cause?.sourceError?.message ??
      erroComCausa.cause?.sourceError?.cause?.message,
    nomeCausa:
      erroComCausa.cause?.name ??
      erroComCausa.cause?.sourceError?.name ??
      erroComCausa.cause?.sourceError?.cause?.name,
  };
}

function erroTransitorioBanco(erro: unknown) {
  const detalhes = obterDetalhesErroBanco(erro);
  const texto = `${detalhes.mensagem} ${detalhes.causa ?? ""}`.toLowerCase();

  return (
    texto.includes("fetch failed") ||
    texto.includes("network") ||
    texto.includes("timeout") ||
    detalhes.codigo === "ETIMEDOUT" ||
    detalhes.codigo === "ECONNRESET" ||
    (detalhes.nomeCausa === "NeonDbError" && !detalhes.codigo)
  );
}

async function executarConsultaFornecedores<T>(
  operacao: () => Promise<T>,
): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (!erroTransitorioBanco(erro)) {
      throw erro;
    }

    console.warn("[listarFornecedoresAdmin:banco:tentando-novamente]", {
      ...obterDetalhesErroBanco(erro),
    });

    return operacao();
  }
}

export async function listarFornecedoresAdmin(): Promise<
  FornecedorComResumoImportacoes[]
> {
  const [fornecedores, resumos, importacoesOrdenadas, integracoesApi] =
    await Promise.all([
      executarConsultaFornecedores(() =>
        db
          .select({
            id: fornecedoresTable.id,
            nome: fornecedoresTable.nome,
            tipoIntegracao: fornecedoresTable.tipoIntegracao,
            status: fornecedoresTable.status,
            criadoEm: fornecedoresTable.criadoEm,
            atualizadoEm: fornecedoresTable.atualizadoEm,
          })
          .from(fornecedoresTable)
          .orderBy(asc(fornecedoresTable.nome)),
      ),
      executarConsultaFornecedores(() =>
        db
          .select({
            fornecedorId: importacoesFornecedorTable.fornecedorId,
            totalImportacoes: count(importacoesFornecedorTable.id),
          })
          .from(importacoesFornecedorTable)
          .groupBy(importacoesFornecedorTable.fornecedorId),
      ),
      executarConsultaFornecedores(() =>
        db
          .select({
            fornecedorId: importacoesFornecedorTable.fornecedorId,
            criadoEm: importacoesFornecedorTable.criadoEm,
            status: importacoesFornecedorTable.status,
          })
          .from(importacoesFornecedorTable)
          .orderBy(desc(importacoesFornecedorTable.criadoEm)),
      ),
      executarConsultaFornecedores(() =>
        db
          .select({
            id: fornecedorIntegracoesApiTable.id,
            fornecedorId: fornecedorIntegracoesApiTable.fornecedorId,
            provedor: fornecedorIntegracoesApiTable.provedor,
            ambiente: fornecedorIntegracoesApiTable.ambiente,
            urlBase: fornecedorIntegracoesApiTable.urlBase,
            cnpjEmpresa: fornecedorIntegracoesApiTable.cnpjEmpresa,
            ativo: fornecedorIntegracoesApiTable.ativo,
            tokenClienteCriptografado:
              fornecedorIntegracoesApiTable.tokenClienteCriptografado,
            ultimoTesteStatus: fornecedorIntegracoesApiTable.ultimoTesteStatus,
            ultimoTesteEm: fornecedorIntegracoesApiTable.ultimoTesteEm,
            criadoEm: fornecedorIntegracoesApiTable.criadoEm,
            atualizadoEm: fornecedorIntegracoesApiTable.atualizadoEm,
          })
          .from(fornecedorIntegracoesApiTable),
      ),
    ]);

  const totalPorFornecedor = new Map(
    resumos.map((resumo) => [resumo.fornecedorId, resumo.totalImportacoes]),
  );
  const ultimaPorFornecedor = new Map<
    string,
    {
      criadoEm: Date | null;
      status: FornecedorComResumoImportacoes["ultimaImportacaoStatus"];
    }
  >();

  for (const importacao of importacoesOrdenadas) {
    if (ultimaPorFornecedor.has(importacao.fornecedorId)) continue;

    ultimaPorFornecedor.set(importacao.fornecedorId, {
      criadoEm: importacao.criadoEm,
      status: importacao.status,
    });
  }
  const integracaoPorFornecedor = new Map(
    integracoesApi.map((integracao) => [
      integracao.fornecedorId,
      {
        id: integracao.id,
        fornecedorId: integracao.fornecedorId,
        provedor: integracao.provedor,
        ambiente: integracao.ambiente,
        urlBase: integracao.urlBase,
        cnpjEmpresa: integracao.cnpjEmpresa,
        ativo: integracao.ativo,
        tokenConfigurado: Boolean(integracao.tokenClienteCriptografado),
        ultimoTesteStatus: integracao.ultimoTesteStatus,
        ultimoTesteEm: integracao.ultimoTesteEm,
        criadoEm: integracao.criadoEm,
        atualizadoEm: integracao.atualizadoEm,
      },
    ]),
  );

  return fornecedores.map((fornecedor) => ({
    ...fornecedor,
    totalImportacoes: totalPorFornecedor.get(fornecedor.id) ?? 0,
    ultimaImportacaoEm:
      ultimaPorFornecedor.get(fornecedor.id)?.criadoEm ?? null,
    ultimaImportacaoStatus:
      ultimaPorFornecedor.get(fornecedor.id)?.status ?? null,
    integracaoApi: integracaoPorFornecedor.get(fornecedor.id) ?? null,
  }));
}
