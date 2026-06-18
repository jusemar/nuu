"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  fornecedorProdutosApiStagingTable,
  fornecedorIntegracoesApiTable,
} from "@/db/schema";
import { db } from "@/db/connection";
import { auth } from "@/lib/auth";

import { METODOS_LAQUILA } from "../constants";
import {
  TIMEOUT_TESTE_CONEXAO_LAQUILA_MS,
  consultarProdutosLaquila as consultarProdutosLaquilaApi,
  criarClienteLaquila,
} from "../lib/cliente-laquila";
import { descriptografarTokenLaquila } from "../lib/mascarar-segredos-laquila";
import { normalizarProdutosLaquila } from "../lib/normalizar-produto-laquila";
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
  totalSalvo?: number;
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

  return configuracao ?? null;
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

async function salvarProdutosStagingApi({
  integracaoId,
  produtos,
}: {
  integracaoId: string;
  produtos: ReturnType<typeof normalizarProdutosLaquila>;
}) {
  if (produtos.length === 0) return 0;

  const agora = new Date();

  await db
    .insert(fornecedorProdutosApiStagingTable)
    .values(
      produtos.map((produto) => ({
        integracaoApiId: integracaoId,
        codigoFornecedor: produto.codigoFornecedor,
        nomeProduto: produto.nomeProduto,
        ean: produto.ean,
        ncm: produto.ncm,
        marcaFornecedor: produto.marcaFornecedor,
        grupoFornecedor: produto.grupoFornecedor,
        subgrupoFornecedor: produto.subgrupoFornecedor,
        precoFornecedor: produto.precoFornecedor,
        estoqueFornecedor: produto.estoqueFornecedor,
        imagemUrl: produto.imagemUrl,
        unidade: produto.unidade,
        pesoBruto: produto.pesoBruto,
        pesoLiquido: produto.pesoLiquido,
        largura: produto.largura,
        altura: produto.altura,
        comprimento: produto.comprimento,
        dadosBrutosJson: produto.dadosBrutosJson,
        status: "novo" as const,
        ultimaConsultaEm: agora,
        atualizadoEm: agora,
      })),
    )
    .onConflictDoUpdate({
      target: [
        fornecedorProdutosApiStagingTable.integracaoApiId,
        fornecedorProdutosApiStagingTable.codigoFornecedor,
      ],
      set: {
        nomeProduto: sql`excluded.nome_produto`,
        ean: sql`excluded.ean`,
        ncm: sql`excluded.ncm`,
        marcaFornecedor: sql`excluded.marca_fornecedor`,
        grupoFornecedor: sql`excluded.grupo_fornecedor`,
        subgrupoFornecedor: sql`excluded.subgrupo_fornecedor`,
        precoFornecedor: sql`excluded.preco_fornecedor`,
        estoqueFornecedor: sql`excluded.estoque_fornecedor`,
        imagemUrl: sql`excluded.imagem_url`,
        unidade: sql`excluded.unidade`,
        pesoBruto: sql`excluded.peso_bruto`,
        pesoLiquido: sql`excluded.peso_liquido`,
        largura: sql`excluded.largura`,
        altura: sql`excluded.altura`,
        comprimento: sql`excluded.comprimento`,
        dadosBrutosJson: sql`excluded.dados_brutos_json`,
        status: "novo",
        ultimaConsultaEm: agora,
        atualizadoEm: agora,
      },
    });

  return produtos.length;
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
        totalSalvo: 0,
      };
    }

    const produtosNormalizados = normalizarProdutosLaquila(resultado.itens);
    const totalSalvo = await salvarProdutosStagingApi({
      integracaoId,
      produtos: produtosNormalizados,
    });

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: integracaoId,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "consultar_produtos_laquila",
      status: "sucesso",
      codigoHttp: resultado.codigoHttp,
      mensagem: "Produtos Laquila consultados e salvos no staging API.",
      requestResumo: {
        pagina,
        itensPorPagina,
        filtrosVazios: true,
      },
      responseResumo: {
        totalConsultado: resultado.itens.length,
        totalNormalizado: produtosNormalizados.length,
        totalSalvo,
      },
    });

    revalidatePath("/admin/fornecedores");
    revalidatePath("/admin/fornecedores/integracoes/laquila");

    return {
      sucesso: true,
      mensagem: "Produtos Laquila consultados com sucesso.",
      totalConsultado: resultado.itens.length,
      totalSalvo,
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
