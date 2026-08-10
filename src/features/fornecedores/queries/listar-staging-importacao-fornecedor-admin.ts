import "server-only";

import {
  and,
  asc,
  count,
  eq,
  ilike,
  isNotNull,
  isNull,
  not,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable, productTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

/**
 * "Este item já concluiu a Publicação NESTA importação?"
 *
 * Vínculo permanente e status da importação são coisas diferentes, e a tela
 * confundia as duas: um produto já publicado continuava exibido como
 * "Vinculado", porque o único sinal consultado era `produto_localizado_id` —
 * que aponta para o produto real e permanece para sempre, inclusive nas
 * próximas importações.
 *
 * O estágio do item dentro DESTA execução está no rascunho dela: `publicado` já
 * existe em `produto_rascunho_status`, então não há enum novo. O `stagingId` e
 * o `importacaoId` gravados em `dados_origem_json` amarram o rascunho à linha
 * de staging certa — é isso que impede a publicação de uma importação de mudar
 * o status exibido em outra.
 */
function publicadoNestaImportacaoSql(importacaoId: string) {
  return sql<boolean>`exists (
    select 1
      from produto_rascunhos pr
     where pr.dados_origem_json->'origemFluxoFornecedor'->>'stagingId' = ${fornecedorProdutosStagingTable.id}::text
       and pr.dados_origem_json->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}
       and pr.status = 'publicado'
  )`;
}

type FiltrosStagingImportacaoFornecedorAdmin = {
  importacaoId: string;
  busca?: string;
  codigoFornecedor?: string;
  categoriaFornecedor?: string;
  marcaFornecedor?: string;
  status?: StatusStagingFiltro;
  /**
   * `publicado` é estágio da importação, não presença de vínculo — por isso
   * entra aqui junto de `vinculado`, e não no filtro de status do staging.
   */
  vinculo?: "vinculado" | "nao_vinculado" | "publicado";
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

  // "Vinculados" passa a significar "vinculado e ainda NÃO publicado nesta
  // importação": depois de publicado o item mudou de estágio, e continuar
  // listando-o ali faria o gestor procurar trabalho onde não há mais.
  if (filtros.vinculo === "vinculado") {
    condicoes.push(
      isNotNull(fornecedorProdutosStagingTable.produtoLocalizadoId),
      not(publicadoNestaImportacaoSql(filtros.importacaoId)),
    );
  }

  if (filtros.vinculo === "nao_vinculado") {
    condicoes.push(isNull(fornecedorProdutosStagingTable.produtoLocalizadoId));
  }

  if (filtros.vinculo === "publicado") {
    condicoes.push(publicadoNestaImportacaoSql(filtros.importacaoId));
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
            publicadoNestaImportacao: publicadoNestaImportacaoSql(
              filtros.importacaoId,
            ),
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

export type ContadoresEstagioVinculacaoFornecedor = {
  todos: number;
  vinculados: number;
  pendentes: number;
  novos: number;
  ignorados: number;
  publicados: number;
  erros: number;
};

/**
 * Contadores por ESTÁGIO da importação inteira, não só da página aberta.
 *
 * Os totais que a Vinculação mostrava vinham do lote paginado em memória, então
 * diziam respeito a 25 linhas de 685. Aqui a conta é feita no banco, sobre a
 * importação toda, e cada item entra em exatamente um estágio — publicado
 * deixa de somar em "vinculados", que é o erro que o gestor viu na tela.
 */
export async function contarEstagiosVinculacaoFornecedor(
  importacaoId: string,
): Promise<ContadoresEstagioVinculacaoFornecedor> {
  const publicado = publicadoNestaImportacaoSql(importacaoId);

  const [linha] = await executarLeituraFornecedores(
    {
      etapa: "vinculacao:contar-estagios",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível calcular o resumo desta importação agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .select({
          todos: count(),
          publicados: sql<number>`count(*) filter (where ${publicado})`,
          ignorados: sql<number>`count(*) filter (where not ${publicado} and ${fornecedorProdutosStagingTable.status} = 'ignorado')`,
          erros: sql<number>`count(*) filter (where not ${publicado} and ${fornecedorProdutosStagingTable.status} in ('erro','rejeitado'))`,
          novos: sql<number>`count(*) filter (where not ${publicado} and ${fornecedorProdutosStagingTable.status} not in ('ignorado','erro','rejeitado') and ${fornecedorProdutosStagingTable.criterioLocalizacao} = 'novo_produto_fornecedor')`,
          vinculados: sql<number>`count(*) filter (where not ${publicado} and ${fornecedorProdutosStagingTable.status} not in ('ignorado','erro','rejeitado') and coalesce(${fornecedorProdutosStagingTable.criterioLocalizacao}, '') <> 'novo_produto_fornecedor' and ${fornecedorProdutosStagingTable.produtoLocalizadoId} is not null)`,
          pendentes: sql<number>`count(*) filter (where not ${publicado} and ${fornecedorProdutosStagingTable.status} not in ('ignorado','erro','rejeitado') and coalesce(${fornecedorProdutosStagingTable.criterioLocalizacao}, '') <> 'novo_produto_fornecedor' and ${fornecedorProdutosStagingTable.produtoLocalizadoId} is null)`,
        })
        .from(fornecedorProdutosStagingTable)
        .where(eq(fornecedorProdutosStagingTable.importacaoId, importacaoId)),
  );

  return {
    todos: Number(linha?.todos ?? 0),
    vinculados: Number(linha?.vinculados ?? 0),
    pendentes: Number(linha?.pendentes ?? 0),
    novos: Number(linha?.novos ?? 0),
    ignorados: Number(linha?.ignorados ?? 0),
    publicados: Number(linha?.publicados ?? 0),
    erros: Number(linha?.erros ?? 0),
  };
}
