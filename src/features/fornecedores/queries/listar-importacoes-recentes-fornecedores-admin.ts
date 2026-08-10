import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedoresTable, importacoesFornecedorTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { derivarEstadoImportacaoFornecedor } from "../lib/estado-importacao-fornecedor";
import { contarItensImportacoesFornecedor } from "./contar-itens-importacoes-fornecedor";

type EntradaListagemImportacoesRecentesFornecedorAdmin = {
  pagina?: number;
  limite?: number;
};

const limitesPermitidos = [4, 8, 12];

function normalizarPagina(valor?: number) {
  return valor && valor > 0 ? valor : 1;
}

function normalizarLimite(valor?: number) {
  return valor && limitesPermitidos.includes(valor) ? valor : 4;
}

export async function listarImportacoesRecentesFornecedoresAdmin(
  entrada: EntradaListagemImportacoesRecentesFornecedorAdmin = {},
) {
  const pagina = normalizarPagina(entrada.pagina);
  const limite = normalizarLimite(entrada.limite);
  const offset = (pagina - 1) * limite;

  // Entrada da tela de Importações: sem retentativa, uma oscilação de conexão
  // derruba a lista inteira em vez de tentar de novo.
  const [itens, total, totaisStatus] = await executarLeituraFornecedores(
    {
      etapa: "importacoes:listar-recentes",
      mensagemAmigavel:
        "Não foi possível carregar as importações recentes agora. Tente novamente em alguns segundos.",
    },
    () =>
      Promise.all([
    db
      .select({
        id: importacoesFornecedorTable.id,
        fornecedorId: importacoesFornecedorTable.fornecedorId,
        nomeFornecedor: fornecedoresTable.nome,
        tipoArquivo: importacoesFornecedorTable.tipoArquivo,
        configuracaoFluxoJson: importacoesFornecedorTable.configuracaoFluxoJson,
        nomeArquivo: importacoesFornecedorTable.nomeArquivo,
        totalLinhas: importacoesFornecedorTable.totalLinhas,
        totalProcessadas: importacoesFornecedorTable.totalProcessadas,
        totalErros: importacoesFornecedorTable.totalErros,
        status: importacoesFornecedorTable.status,
        criadoEm: importacoesFornecedorTable.criadoEm,
      })
      .from(importacoesFornecedorTable)
      .innerJoin(
        fornecedoresTable,
        eq(importacoesFornecedorTable.fornecedorId, fornecedoresTable.id),
      )
      .orderBy(desc(importacoesFornecedorTable.criadoEm))
      .limit(limite)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)` })
      .from(importacoesFornecedorTable),
    db
      .select({
        status: importacoesFornecedorTable.status,
        total: sql<number>`count(*)`,
      })
      .from(importacoesFornecedorTable)
      .groupBy(importacoesFornecedorTable.status),
      ]),
  );

  // Cada importação carrega os SEUS números. Antes a tela só tinha os totais
  // gravados na própria linha (linhas do arquivo, erros da leitura), que não
  // dizem nada sobre publicado, pendente ou ignorado — e a API sequer aparecia
  // aqui, porque não criava importação.
  const contadores = await contarItensImportacoesFornecedor(
    itens.map((item) => item.id),
  );

  function ehRegistro(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === "object" && valor !== null && !Array.isArray(valor);
  }

  const itensComContadores = itens.map((item) => {
    const contador = contadores.get(item.id) ?? {
      total: 0,
      publicados: 0,
      pendentes: 0,
      ignorados: 0,
      erros: 0,
    };
    const provedor =
      ehRegistro(item.configuracaoFluxoJson) &&
      typeof item.configuracaoFluxoJson.provedor === "string"
        ? item.configuracaoFluxoJson.provedor
        : null;
    const origemApi = item.tipoArquivo === "api";

    return {
      ...item,
      origem: origemApi ? ("api" as const) : ("arquivo" as const),
      provedor,
      /** O que identifica a aquisição na tela: arquivo tem nome, API tem provedor. */
      rotuloOrigem: origemApi
        ? (provedor === "laquila" ? "Laquila" : (provedor ?? "API"))
        : (item.nomeArquivo ?? "Arquivo enviado"),
      /** Número curto de controle, legível sem expor o uuid inteiro. */
      numeroControle: item.id.slice(0, 8),
      contadores: {
        ...contador,
        // `total_erros` cobre as falhas da leitura do arquivo, que não deixam
        // linha em staging para serem contadas.
        erros: Math.max(contador.erros, item.totalErros),
      },
      estado: derivarEstadoImportacaoFornecedor({
        contadores: {
          ...contador,
          erros: Math.max(contador.erros, item.totalErros),
        },
        statusImportacao: item.status,
      }),
    };
  });

  return {
    itens: itensComContadores,
    totaisStatus: Object.fromEntries(
      totaisStatus.map((item) => [item.status, Number(item.total)]),
    ) as Record<string, number>,
    paginacao: {
      pagina,
      limite,
      total: Number(total[0]?.total ?? 0),
      totalPaginas: Math.max(
        1,
        Math.ceil(Number(total[0]?.total ?? 0) / limite),
      ),
    },
  };
}
