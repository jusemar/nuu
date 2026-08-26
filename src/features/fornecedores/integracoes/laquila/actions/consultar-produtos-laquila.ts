"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db/connection";
import { fornecedorIntegracoesApiTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { METODOS_LAQUILA } from "../constants";
import {
  resolverUrlBaseLaquila,
  validarAmbienteLaquilaAplicacao,
} from "../lib/ambiente-laquila";
import {
  consultarProdutosLaquila as consultarProdutosLaquilaApi,
  consultarSaldoPrecoLaquila as consultarSaldoPrecoLaquilaApi,
  criarClienteLaquila,
  TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
} from "../lib/cliente-laquila";
import { descriptografarTokenLaquila } from "../lib/mascarar-segredos-laquila";
import { normalizarProdutosLaquila } from "../lib/normalizar-produto-laquila";
import {
  normalizarSaldosPrecosLaquila,
  type SaldoPrecoLaquilaNormalizado,
} from "../lib/normalizar-saldo-preco-laquila";
import { registrarLogIntegracaoFornecedorApi } from "../lib/registrar-log-integracao-fornecedor-api";
import { consultarProdutosLaquilaSchema } from "../schemas";

type ProdutoPreviaLaquila = {
  codigo: string;
  nome: string;
  marca: string | null;
  ean: string | null;
  ncm: string | null;
};

type ResultadoConsultarProdutosLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  totalConsultado?: number;
  totalSaldoPrecoConsultado?: number;
  totalAtualizadoComPreco?: number;
  totalAtualizadoComEstoque?: number;
  produtos?: ProdutoPreviaLaquila[];
};

async function validarSessaoAdmin() {
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  return Boolean(sessao?.user);
}

async function buscarConfiguracaoConsulta(integracaoId: string) {
  const [configuracao] = await db
    .select({
      id: fornecedorIntegracoesApiTable.id,
      ambiente: fornecedorIntegracoesApiTable.ambiente,
      urlBase: fornecedorIntegracoesApiTable.urlBase,
      cnpjEmpresa: fornecedorIntegracoesApiTable.cnpjEmpresa,
      tokenClienteCriptografado:
        fornecedorIntegracoesApiTable.tokenClienteCriptografado,
    })
    .from(fornecedorIntegracoesApiTable)
    .where(
      and(
        eq(fornecedorIntegracoesApiTable.id, integracaoId),
        eq(fornecedorIntegracoesApiTable.provedor, "laquila"),
      ),
    )
    .limit(1);

  if (!configuracao) return null;
  validarAmbienteLaquilaAplicacao(configuracao.ambiente);
  return {
    ...configuracao,
    urlBase: resolverUrlBaseLaquila(
      configuracao.ambiente,
      configuracao.urlBase,
    ),
  };
}

function montarPrevia(produtos: ReturnType<typeof normalizarProdutosLaquila>) {
  return produtos.slice(0, 10).map((produto) => ({
    codigo: produto.codigoFornecedor,
    nome: produto.nomeProduto,
    marca: produto.marcaFornecedor,
    ean: produto.ean,
    ncm: produto.ncm,
  }));
}

/**
 * Quantos códigos consultados vieram com preço e/ou estoque no método 00006.
 *
 * Esta action é o BOTÃO DE DIAGNÓSTICO da tela de configuração: ela confere se
 * as credenciais respondem e o que a Laquila devolve. Ela não grava mais nada
 * em `fornecedor_produtos_api_staging` — staging pertence a uma execução
 * (`importacoes_fornecedor`), e quem cria execução é `iniciarSincronizacaoLaquila`.
 * Escrever aqui produzia justamente as linhas sem `importacaoId` que hoje são
 * tratadas como legado.
 */
function resumirSaldoPrecoConsultado(
  saldosPrecos: SaldoPrecoLaquilaNormalizado[],
) {
  let totalComPreco = 0;
  let totalComEstoque = 0;

  for (const saldoPreco of saldosPrecos) {
    if (saldoPreco.precoFornecedor !== null) totalComPreco += 1;
    if (saldoPreco.estoqueFornecedor !== null) totalComEstoque += 1;
  }

  return { totalComPreco, totalComEstoque };
}

export async function consultarProdutosLaquila(
  entrada: unknown,
): Promise<ResultadoConsultarProdutosLaquila> {
  const validacao = consultarProdutosLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Dados inválidos para consultar produtos Laquila.",
    };
  }

  const sessaoValida = await validarSessaoAdmin();

  if (!sessaoValida) {
    return {
      sucesso: false,
      erro: "Sessão expirada. Entre novamente para consultar produtos.",
    };
  }

  const { integracaoId, pagina, itensPorPagina } = validacao.data;

  try {
    const configuracao = await buscarConfiguracaoConsulta(integracaoId);

    if (!configuracao) {
      return {
        sucesso: false,
        erro: "Configuração Laquila não encontrada.",
      };
    }

    if (!configuracao.tokenClienteCriptografado) {
      return {
        sucesso: false,
        erro: "Configure o token antes de consultar produtos.",
      };
    }

    const tokenCliente = descriptografarTokenLaquila(
      configuracao.tokenClienteCriptografado,
    );
    const cliente = criarClienteLaquila(
      configuracao,
      TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
    );
    const resultado = await consultarProdutosLaquilaApi({
      cliente,
      tokenCliente,
      pagina,
      itensPorPagina,
    });

    if (!resultado.sucesso) {
      await registrarLogIntegracaoFornecedorApi({
        integracaoApiId: integracaoId,
        metodo: METODOS_LAQUILA.consultarItem,
        operacao: "consultar_produtos_laquila",
        status: "erro",
        codigoHttp: resultado.codigoHttp,
        mensagem: resultado.erro,
        requestResumo: {
          pagina,
          itensPorPagina,
          filtrosVazios: true,
        },
        responseResumo: {
          erro: resultado.erro,
          codigoHttp: resultado.codigoHttp,
          diagnostico: resultado.diagnostico,
        },
      });

      return {
        sucesso: false,
        erro: resultado.erro,
        totalConsultado: 0,
      };
    }

    const produtosNormalizados = normalizarProdutosLaquila(resultado.itens);
    const resultadoSaldoPreco = await consultarSaldoPrecoLaquilaApi({
      cliente,
      tokenCliente,
      pagina,
      itensPorPagina,
    });
    let totalSaldoPrecoConsultado = 0;
    let totalAtualizadoComPreco = 0;
    let totalAtualizadoComEstoque = 0;

    if (resultadoSaldoPreco.sucesso) {
      const saldosPrecosNormalizados = normalizarSaldosPrecosLaquila(
        resultadoSaldoPreco.itens,
      );
      const resumo = resumirSaldoPrecoConsultado(saldosPrecosNormalizados);

      totalSaldoPrecoConsultado = resultadoSaldoPreco.itens.length;
      totalAtualizadoComPreco = resumo.totalComPreco;
      totalAtualizadoComEstoque = resumo.totalComEstoque;

      await registrarLogIntegracaoFornecedorApi({
        integracaoApiId: integracaoId,
        metodo: METODOS_LAQUILA.consultarSaldo,
        operacao: "consultar_saldo_preco_laquila",
        status: "sucesso",
        codigoHttp: resultadoSaldoPreco.codigoHttp,
        mensagem: "Saldo e preço Laquila consultados para diagnóstico.",
        requestResumo: {
          pagina,
          itensPorPagina,
          codigoItemVazio: true,
        },
        responseResumo: {
          totalConsultado: totalSaldoPrecoConsultado,
          totalAtualizadoComPreco,
          totalAtualizadoComEstoque,
        },
      });
    } else {
      await registrarLogIntegracaoFornecedorApi({
        integracaoApiId: integracaoId,
        metodo: METODOS_LAQUILA.consultarSaldo,
        operacao: "consultar_saldo_preco_laquila",
        status: "erro",
        codigoHttp: resultadoSaldoPreco.codigoHttp,
        mensagem: resultadoSaldoPreco.erro,
        requestResumo: {
          pagina,
          itensPorPagina,
          codigoItemVazio: true,
        },
        responseResumo: {
          erro: resultadoSaldoPreco.erro,
          codigoHttp: resultadoSaldoPreco.codigoHttp,
          diagnostico: resultadoSaldoPreco.diagnostico,
        },
      });
    }

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracaoId,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "consultar_produtos_laquila",
      status: "sucesso",
      codigoHttp: resultado.codigoHttp,
      mensagem:
        "Produtos Laquila consultados para diagnóstico da configuração.",
      requestResumo: {
        pagina,
        itensPorPagina,
        filtrosVazios: true,
      },
      responseResumo: {
        totalConsultado: resultado.itens.length,
        totalNormalizado: produtosNormalizados.length,
        totalSaldoPrecoConsultado,
        totalAtualizadoComPreco,
        totalAtualizadoComEstoque,
      },
    });

    revalidatePath("/admin/fornecedores");
    revalidatePath("/admin/fornecedores/integracoes/laquila");

    return {
      sucesso: true,
      mensagem: "Produtos Laquila consultados com sucesso.",
      totalConsultado: resultado.itens.length,
      totalSaldoPrecoConsultado,
      totalAtualizadoComPreco,
      totalAtualizadoComEstoque,
      produtos: montarPrevia(produtosNormalizados),
    };
  } catch (erro) {
    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracaoId,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "consultar_produtos_laquila",
      status: "erro",
      mensagem:
        erro instanceof Error
          ? erro.message
          : "Erro desconhecido ao consultar produtos.",
    }).catch(() => undefined);

    return {
      sucesso: false,
      erro: "Não foi possível consultar produtos Laquila.",
    };
  }
}
