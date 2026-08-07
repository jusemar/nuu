import "server-only";

import { and, asc, count, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable, productTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

type FiltrosStagingImportacaoFornecedorAdmin = {
  importacaoId: string;
  busca?: string;
  codigoFornecedor?: string;
  categoriaFornecedor?: string;
  marcaFornecedor?: string;
  status?: StatusStagingFiltro;
  vinculo?: "vinculado" | "nao_vinculado";
  pagina?: number;
  limite?: number;
};

const limitesPermitidos = [25, 50, 100];
const statusPermitidos = [
  "aguardando_analise",
  "localizado",
  "nao_localizado",
  "erro",
  "rejeitado",
  "aprovado",
  "ignorado",
] as const;

type StatusStagingFiltro = (typeof statusPermitidos)[number];

function normalizarPagina(valor?: number) {
  return valor && valor > 0 ? valor : 1;
}

function normalizarLimite(valor?: number) {
  return valor && limitesPermitidos.includes(valor) ? valor : 25;
}

function montarCondicoes(filtros: FiltrosStagingImportacaoFornecedorAdmin) {
  const condicoes = [
    eq(fornecedorProdutosStagingTable.importacaoId, filtros.importacaoId),
  ];

  if (filtros.busca) {
    condicoes.push(
      or(
        ilike(fornecedorProdutosStagingTable.nomeProduto, `%${filtros.busca}%`),
        ilike(productTable.name, `%${filtros.busca}%`),
      )!,
    );
  }

  if (filtros.codigoFornecedor) {
    condicoes.push(
      ilike(
        fornecedorProdutosStagingTable.codigoFornecedor,
        `%${filtros.codigoFornecedor}%`,
      ),
    );
  }

  if (filtros.categoriaFornecedor) {
    condicoes.push(
      eq(
        fornecedorProdutosStagingTable.categoriaFornecedor,
        filtros.categoriaFornecedor,
      ),
    );
  }

  if (filtros.marcaFornecedor) {
    condicoes.push(
      eq(
        fornecedorProdutosStagingTable.marcaFornecedor,
        filtros.marcaFornecedor,
      ),
    );
  }

  if (filtros.status) {
    condicoes.push(eq(fornecedorProdutosStagingTable.status, filtros.status));
  }

  if (filtros.vinculo === "vinculado") {
    condicoes.push(
      isNotNull(fornecedorProdutosStagingTable.produtoLocalizadoId),
    );
  }

  if (filtros.vinculo === "nao_vinculado") {
    condicoes.push(isNull(fornecedorProdutosStagingTable.produtoLocalizadoId));
  }

  return and(...condicoes);
}

export async function listarStagingImportacaoFornecedorAdmin(
  filtros: FiltrosStagingImportacaoFornecedorAdmin,
) {
  const pagina = normalizarPagina(filtros.pagina);
  const limite = normalizarLimite(filtros.limite);
  const offset = (pagina - 1) * limite;
  const condicoes = montarCondicoes(filtros);

  // As duas consultas (página + contagem) ficam dentro da MESMA leitura protegida porque
  // precisam concordar entre si: repetir só a contagem poderia devolver um total que não
  // corresponde às linhas exibidas.
  const [linhas, totalLinhas] = await executarLeituraFornecedores(
    {
      etapa: "vinculacao:listar-staging-paginado",
      importacaoId: filtros.importacaoId,
      mensagemAmigavel:
        "Não foi possível carregar os produtos desta importação agora. Tente novamente em alguns segundos.",
    },
    () =>
      Promise.all([
        db
          .select({
            id: fornecedorProdutosStagingTable.id,
            importacaoId: fornecedorProdutosStagingTable.importacaoId,
            codigoFornecedor: fornecedorProdutosStagingTable.codigoFornecedor,
            nomeProduto: fornecedorProdutosStagingTable.nomeProduto,
            categoriaFornecedor:
              fornecedorProdutosStagingTable.categoriaFornecedor,
            marcaFornecedor: fornecedorProdutosStagingTable.marcaFornecedor,
            precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
            precoOriginal: fornecedorProdutosStagingTable.precoOriginal,
            precoCalculado: fornecedorProdutosStagingTable.precoCalculado,
            origemAjuste: fornecedorProdutosStagingTable.origemAjuste,
            estoqueFornecedor: fornecedorProdutosStagingTable.estoqueFornecedor,
            produtoLocalizadoId:
              fornecedorProdutosStagingTable.produtoLocalizadoId,
            criterioLocalizacao:
              fornecedorProdutosStagingTable.criterioLocalizacao,
            errosValidacao: fornecedorProdutosStagingTable.errosValidacao,
            dadosBrutos: fornecedorProdutosStagingTable.dadosBrutos,
            status: fornecedorProdutosStagingTable.status,
            criadoEm: fornecedorProdutosStagingTable.criadoEm,
            atualizadoEm: fornecedorProdutosStagingTable.atualizadoEm,
            produtoVinculadoNome: productTable.name,
            produtoVinculadoSku: productTable.sku,
          })
          .from(fornecedorProdutosStagingTable)
          .leftJoin(
            productTable,
            eq(
              productTable.id,
              fornecedorProdutosStagingTable.produtoLocalizadoId,
            ),
          )
          .where(condicoes)
          .orderBy(asc(fornecedorProdutosStagingTable.criadoEm))
          .limit(limite)
          .offset(offset),
        db
          .select({ total: count() })
          .from(fornecedorProdutosStagingTable)
          .leftJoin(
            productTable,
            eq(
              productTable.id,
              fornecedorProdutosStagingTable.produtoLocalizadoId,
            ),
          )
          .where(condicoes),
      ]),
  );

  const total = Number(totalLinhas[0]?.total ?? 0);

  return {
    linhas,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    },
  };
}
