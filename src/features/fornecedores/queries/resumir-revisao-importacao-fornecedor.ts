import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

export type ResumoRevisaoImportacaoFornecedor = {
  totalImportado: number;
  totalSemCodigo: number;
  totalSemCategoria: number;
  totalSemNome: number;
  totalSemMarca: number;
  totalPrecoInvalido: number;
  totalProdutosOK: number;
  totalComProblema: number;
};

/**
 * Os oito números do resumo da importação, contados NO BANCO.
 *
 * Antes vinham de `analisarRevisaoImportacaoFornecedor`, que carregava as 685
 * linhas inteiras — com `dados_brutos` (o jsonb da linha da planilha) junto —
 * só para incrementar contadores num laço em JavaScript. E carregava em TODAS
 * as etapas, porque o resumo aparece no topo da tela o tempo inteiro.
 *
 * As regras são as mesmas de `analise-revisao-importacao.service.ts`:
 * campo "vazio" é nulo ou só espaços; preço inválido é ausente ou negativo
 * (a coluna é `numeric`, então texto malformado não chega até aqui).
 */
export async function resumirRevisaoImportacaoFornecedor(
  importacaoId: string,
): Promise<ResumoRevisaoImportacaoFornecedor> {
  const semCodigo = sql`coalesce(btrim(${fornecedorProdutosStagingTable.codigoFornecedor}), '') = ''`;
  const semCategoria = sql`coalesce(btrim(${fornecedorProdutosStagingTable.categoriaFornecedor}), '') = ''`;
  const semNome = sql`coalesce(btrim(${fornecedorProdutosStagingTable.nomeProduto}), '') = ''`;
  const semMarca = sql`coalesce(btrim(${fornecedorProdutosStagingTable.marcaFornecedor}), '') = ''`;
  const precoInvalido = sql`${fornecedorProdutosStagingTable.precoFornecedor} is null or ${fornecedorProdutosStagingTable.precoFornecedor} < 0`;
  const comProblema = sql`(${semCodigo}) or (${semCategoria}) or (${semNome}) or (${semMarca}) or (${precoInvalido})`;

  const [linha] = await executarLeituraFornecedores(
    {
      etapa: "importacoes:resumir-revisao",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível carregar o resumo desta importação agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .select({
          totalImportado: sql<number>`count(*)`,
          totalSemCodigo: sql<number>`count(*) filter (where ${semCodigo})`,
          totalSemCategoria: sql<number>`count(*) filter (where ${semCategoria})`,
          totalSemNome: sql<number>`count(*) filter (where ${semNome})`,
          totalSemMarca: sql<number>`count(*) filter (where ${semMarca})`,
          totalPrecoInvalido: sql<number>`count(*) filter (where ${precoInvalido})`,
          totalComProblema: sql<number>`count(*) filter (where ${comProblema})`,
          totalProdutosOK: sql<number>`count(*) filter (where not (${comProblema}))`,
        })
        .from(fornecedorProdutosStagingTable)
        .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId)),
  );

  return {
    totalImportado: Number(linha?.totalImportado ?? 0),
    totalSemCodigo: Number(linha?.totalSemCodigo ?? 0),
    totalSemCategoria: Number(linha?.totalSemCategoria ?? 0),
    totalSemNome: Number(linha?.totalSemNome ?? 0),
    totalSemMarca: Number(linha?.totalSemMarca ?? 0),
    totalPrecoInvalido: Number(linha?.totalPrecoInvalido ?? 0),
    totalProdutosOK: Number(linha?.totalProdutosOK ?? 0),
    totalComProblema: Number(linha?.totalComProblema ?? 0),
  };
}

export type ValoresDistintosStagingFornecedor = {
  categorias: string[];
  marcas: string[];
};

/**
 * Valores distintos de categoria e marca, para alimentar os filtros.
 *
 * Também substituem uma varredura completa: a tela lia as 685 linhas e montava
 * dois `Set` em memória — cálculo que ainda era REPETIDO dentro do componente,
 * sobre o mesmo array.
 */
export async function listarValoresDistintosStagingFornecedor(
  importacaoId: string,
): Promise<ValoresDistintosStagingFornecedor> {
  const linhas = await executarLeituraFornecedores(
    {
      etapa: "importacoes:valores-distintos",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível carregar os filtros desta importação agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .selectDistinct({
          categoria: fornecedorProdutosStagingTable.categoriaFornecedor,
          marca: fornecedorProdutosStagingTable.marcaFornecedor,
        })
        .from(fornecedorProdutosStagingTable)
        .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId)),
  );

  function ordenar(valores: Array<string | null>) {
    return Array.from(
      new Set(
        valores
          .map((valor) => valor?.trim())
          .filter((valor): valor is string => Boolean(valor)),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  return {
    categorias: ordenar(linhas.map((linha) => linha.categoria)),
    marcas: ordenar(linhas.map((linha) => linha.marca)),
  };
}
