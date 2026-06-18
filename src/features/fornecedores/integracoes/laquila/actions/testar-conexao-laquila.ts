"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { fornecedorIntegracoesApiTable } from "@/db/schema";

import { METODOS_LAQUILA } from "../constants";
import {
  TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
  criarClienteLaquila,
  testarConexaoTransportadorasLaquila,
} from "../lib/cliente-laquila";
import { descriptografarTokenLaquila } from "../lib/mascarar-segredos-laquila";
import { registrarLogIntegracaoFornecedorApi } from "../lib/registrar-log-integracao-fornecedor-api";
import { testarConexaoLaquilaSchema } from "../schemas";
import type {
  ConfiguracaoLaquilaSegura,
  ResultadoTestarConexaoLaquila,
  StatusTesteIntegracaoLaquila,
} from "../types";

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

function obterDetalhesErro(erro: unknown) {
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
    mensagem: erro.message,
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

function sanitizarMensagemErro(mensagem: string) {
  return mensagem
    .replace(/params:[\s\S]*/i, "params: [removido]")
    .replace(
      /(api-dropshipping\.laquila\.com\.br\/)([^/\s]+)(\/\d{5})/gi,
      "$1[token-rota]$3",
    )
    .replace(/v1:[A-Za-z0-9+/=:-]+/g, "[token-criptografado-removido]");
}

function obterDetalhesErroSeguro(erro: unknown) {
  const detalhes = obterDetalhesErro(erro);

  return {
    ...detalhes,
    mensagem: sanitizarMensagemErro(detalhes.mensagem),
    causa: detalhes.causa ? sanitizarMensagemErro(detalhes.causa) : undefined,
  };
}

function erroTransitorioBanco(erro: unknown) {
  const detalhes = obterDetalhesErro(erro);
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

async function executarBancoLaquila<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (erro) {
    if (!erroTransitorioBanco(erro)) {
      throw erro;
    }

    console.warn("[testarConexaoLaquila:banco:tentando-novamente]", {
      ...obterDetalhesErroSeguro(erro),
    });

    return operacao();
  }
}

async function atualizarResultadoTeste({
  integracaoId,
  status,
  data,
}: {
  integracaoId: string;
  status: StatusTesteIntegracaoLaquila;
  data: Date;
}) {
  await executarBancoLaquila(() =>
    db
      .update(fornecedorIntegracoesApiTable)
      .set({
        ultimoTesteStatus: status,
        ultimoTesteEm: data,
        atualizadoEm: data,
      })
      .where(eq(fornecedorIntegracoesApiTable.id, integracaoId)),
  );
}

async function buscarConfiguracaoSegura(
  integracaoId: string,
): Promise<ConfiguracaoLaquilaSegura | null> {
  const [configuracao] = await executarBancoLaquila(() =>
    db
      .select({
        id: fornecedorIntegracoesApiTable.id,
        urlBase: fornecedorIntegracoesApiTable.urlBase,
        cnpjEmpresa: fornecedorIntegracoesApiTable.cnpjEmpresa,
        tokenClienteCriptografado:
          fornecedorIntegracoesApiTable.tokenClienteCriptografado,
      })
      .from(fornecedorIntegracoesApiTable)
      .where(eq(fornecedorIntegracoesApiTable.id, integracaoId))
      .limit(1),
  );

  return configuracao ?? null;
}

export async function testarConexaoLaquila(
  entrada: unknown,
): Promise<ResultadoTestarConexaoLaquila> {
  const validacao = testarConexaoLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro: validacao.error.issues[0]?.message ?? "Configuração inválida.",
    };
  }

  const { integracaoId } = validacao.data;
  const dataTeste = new Date();

  try {
    const configuracao = await buscarConfiguracaoSegura(integracaoId);

    if (!configuracao) {
      return {
        sucesso: false,
        erro: "Configuração Laquila não encontrada.",
      };
    }

    if (!configuracao.tokenClienteCriptografado) {
      await atualizarResultadoTeste({
        integracaoId,
        status: "erro",
        data: dataTeste,
      });

      await registrarLogIntegracaoFornecedorApi({
        integracaoApiId: integracaoId,
        metodo: METODOS_LAQUILA.retornarTransportadoras,
        operacao: "teste_conexao_laquila",
        status: "erro",
        mensagem: "Token cliente não configurado.",
        requestResumo: {
          cnpjEmpresa: configuracao.cnpjEmpresa,
          tokenClienteConfigurado: false,
        },
      });

      revalidatePath("/admin/fornecedores/integracoes/laquila");

      return {
        sucesso: false,
        erro: "Configure o token antes de testar a conexão.",
        ultimoTesteStatus: "erro",
        ultimoTesteEm: dataTeste,
      };
    }

    const tokenCliente = descriptografarTokenLaquila(
      configuracao.tokenClienteCriptografado,
    );
    const cliente = criarClienteLaquila(
      configuracao,
      TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
    );
    const resultado = await testarConexaoTransportadorasLaquila({
      cliente,
      tokenCliente,
    });
    const statusTeste = resultado.sucesso ? "sucesso" : "erro";

    await atualizarResultadoTeste({
      integracaoId,
      status: statusTeste,
      data: dataTeste,
    });

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracaoId,
      metodo: METODOS_LAQUILA.retornarTransportadoras,
      operacao: "teste_conexao_laquila",
      status: resultado.sucesso ? "sucesso" : "erro",
      codigoHttp: resultado.codigoHttp,
      mensagem: resultado.sucesso
        ? "Comunicação com a API Laquila validada."
        : resultado.erro,
      requestResumo: {
        cnpjEmpresa: configuracao.cnpjEmpresa,
        tokenClienteConfigurado: true,
        metodo: METODOS_LAQUILA.retornarTransportadoras,
        urlBaseConfigurada: Boolean(configuracao.urlBase?.trim()),
      },
      responseResumo: resultado.sucesso
        ? {
            codigoHttp: resultado.codigoHttp,
            possuiResposta: Object.keys(resultado.dados).length > 0,
          }
        : {
            codigoHttp: resultado.codigoHttp,
            erro: resultado.erro,
            possuiResposta: Boolean(resultado.dados),
            diagnostico: resultado.diagnostico,
          },
    });

    if (!resultado.sucesso) {
      console.error("[testarConexaoLaquila]", {
        integracaoId,
        metodo: METODOS_LAQUILA.retornarTransportadoras,
        codigoHttp: resultado.codigoHttp,
        erro: resultado.erro,
        diagnostico: resultado.diagnostico,
      });
    }

    revalidatePath("/admin/fornecedores/integracoes/laquila");

    if (!resultado.sucesso) {
      return {
        sucesso: false,
        erro: resultado.erro,
        ultimoTesteStatus: statusTeste,
        ultimoTesteEm: dataTeste,
      };
    }

    return {
      sucesso: true,
      mensagem: "Conexão com a API Laquila validada com sucesso.",
      ultimoTesteStatus: statusTeste,
      ultimoTesteEm: dataTeste,
    };
  } catch (erro) {
    console.error("[testarConexaoLaquila:erro-nao-tratado]", {
      integracaoId,
      ...obterDetalhesErroSeguro(erro),
      transitorioBanco: erroTransitorioBanco(erro),
    });

    await atualizarResultadoTeste({
      integracaoId,
      status: "erro",
      data: dataTeste,
    }).catch(() => undefined);

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracaoId,
      metodo: METODOS_LAQUILA.retornarTransportadoras,
      operacao: "teste_conexao_laquila",
      status: "erro",
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido.",
    }).catch(() => undefined);

    revalidatePath("/admin/fornecedores/integracoes/laquila");

    return {
      sucesso: false,
      erro: erroTransitorioBanco(erro)
        ? "Falha temporária ao acessar o banco. Tente testar novamente."
        : "Não foi possível testar a conexão Laquila.",
      ultimoTesteStatus: "erro",
      ultimoTesteEm: dataTeste,
    };
  }
}
