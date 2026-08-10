import "server-only";

import {
  and,
  asc,
  count,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  productTable,
  produtoRascunhosTable,
} from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

/**
 * Decisões tomadas nesta importação, agrupadas por linha de staging.
 *
 * Vínculo permanente e estágio da importação são coisas diferentes: um produto
 * publicado continua vinculado para sempre, inclusive nas próximas execuções.
 * O que muda entre etapas está no RASCUNHO desta importação — e é ele que
 * responde "já publicou aqui?" e "o gestor mandou criar produto novo aqui?".
 *
 * Vem como subconsulta agrupada, e não como `exists` correlacionado, por uma
 * razão medida: com `exists` dentro do `case`, o Postgres reavaliava a
 * expressão inteira uma vez por linha e por contador — 685 linhas × 6 baldes,
 * 171 mil buffers e 655 ms POR contador, ~4,6 s na tela. Agrupado, os rascunhos
 * da importação são lidos uma vez só.
 */
function decisoesDaImportacao(importacaoId: string) {
  return db
    .select({
      stagingId:
        sql<string>`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'stagingId'`.as(
          "staging_id",
        ),
      publicado:
        sql<boolean>`bool_or(${produtoRascunhosTable.status} = 'publicado')`.as(
          "publicado",
        ),
      marcadoComoNovo:
        sql<boolean>`bool_or(${produtoRascunhosTable.produtoAtualizadoId} is null and ${produtoRascunhosTable.status} <> 'publicado')`.as(
          "marcado_como_novo",
        ),
    })
    .from(produtoRascunhosTable)
    .where(
      sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
    )
    .groupBy(
      sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'stagingId'`,
    )
    .as("decisoes_da_importacao");
}

type DecisoesDaImportacao = ReturnType<typeof decisoesDaImportacao>;

export const ESTAGIOS_VINCULACAO_FORNECEDOR = [
  "publicado",
  "vinculado",
  "novo",
  "pendente",
  "ignorado",
  "erro",
] as const;

export type EstagioVinculacaoFornecedor =
  (typeof ESTAGIOS_VINCULACAO_FORNECEDOR)[number];

/**
 * Estágio do item, como UMA expressão SQL.
 *
 * Fonte única: o mesmo `CASE` filtra a listagem e alimenta os contadores. Antes
 * havia seis predicados soltos repetidos entre o `where` e o `count filter`, e
 * qualquer ajuste em um sem o outro produzia o sintoma clássico — "o contador
 * diz 42, a lista mostra 44".
 *
 * A ordem é a regra de negócio: terminais primeiro (publicado, ignorado),
 * depois falha de leitura, depois decisão explícita do gestor, depois vínculo,
 * e por fim "ninguém decidiu ainda". É a mesma ordem de
 * `lib/estagio-item-importacao-fornecedor`, que a testa.
 */
function estagioSql(decisoes: DecisoesDaImportacao) {
  return sql<EstagioVinculacaoFornecedor>`case
    when coalesce(${decisoes.publicado}, false) then 'publicado'
    when ${fornecedorProdutosStagingTable.status} = 'ignorado' then 'ignorado'
    when ${fornecedorProdutosStagingTable.status} in ('erro', 'rejeitado') then 'erro'
    when coalesce(${decisoes.marcadoComoNovo}, false) then 'novo'
    when ${fornecedorProdutosStagingTable.produtoLocalizadoId} is not null then 'vinculado'
    else 'pendente'
  end`;
}

type FiltrosStagingImportacaoFornecedorAdmin = {
  importacaoId: string;
  busca?: string;
  codigoFornecedor?: string;
  categoriaFornecedor?: string;
  marcaFornecedor?: string;
  status?: StatusStagingFiltro;
  /** Estágio do item nesta importação. Substituiu o antigo filtro `vinculo`. */
  estagio?: EstagioVinculacaoFornecedor;
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

function montarCondicoes(
  filtros: FiltrosStagingImportacaoFornecedorAdmin,
  decisoes: DecisoesDaImportacao,
) {
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

  // Um filtro só, a partir da MESMA expressão que alimenta os contadores.
  if (filtros.estagio) {
    condicoes.push(sql`${estagioSql(decisoes)} = ${filtros.estagio}`);
  }

  return and(...condicoes);
}

export async function listarStagingImportacaoFornecedorAdmin(
  filtros: FiltrosStagingImportacaoFornecedorAdmin,
) {
  const pagina = normalizarPagina(filtros.pagina);
  const limite = normalizarLimite(filtros.limite);
  const offset = (pagina - 1) * limite;
  const decisoes = decisoesDaImportacao(filtros.importacaoId);
  const condicoes = montarCondicoes(filtros, decisoes);

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
            estagio: estagioSql(decisoes),
          })
          .from(fornecedorProdutosStagingTable)
          .leftJoin(
            productTable,
            eq(
              productTable.id,
              fornecedorProdutosStagingTable.produtoLocalizadoId,
            ),
          )
          .leftJoin(
            decisoes,
            eq(decisoes.stagingId, sql`${fornecedorProdutosStagingTable.id}::text`),
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
          .leftJoin(
            decisoes,
            eq(decisoes.stagingId, sql`${fornecedorProdutosStagingTable.id}::text`),
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
  const decisoes = decisoesDaImportacao(importacaoId);
  const estagio = estagioSql(decisoes);

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
          publicados: sql<number>`count(*) filter (where ${estagio} = 'publicado')`,
          ignorados: sql<number>`count(*) filter (where ${estagio} = 'ignorado')`,
          erros: sql<number>`count(*) filter (where ${estagio} = 'erro')`,
          novos: sql<number>`count(*) filter (where ${estagio} = 'novo')`,
          vinculados: sql<number>`count(*) filter (where ${estagio} = 'vinculado')`,
          pendentes: sql<number>`count(*) filter (where ${estagio} = 'pendente')`,
        })
        .from(fornecedorProdutosStagingTable)
        .leftJoin(
          decisoes,
          eq(decisoes.stagingId, sql`${fornecedorProdutosStagingTable.id}::text`),
        )
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
