import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import {
  cuponsPromocaoTable,
  regrasPromocaoCategoriasTable,
  regrasPromocaoFretesGratisTable,
  regrasPromocaoMarcasTable,
  regrasPromocaoProdutosTable,
  regrasPromocaoSubtotaisTable,
  regrasPromocaoTable,
  usosCuponsPromocaoTable,
} from "../../../db/schema";

import type {
  CupomPromocaoCalculavel,
  RegraFreteGratisPromocaoCalculavel,
  RegraPromocaoCalculavel,
  RegraSubtotalPromocaoCalculavel,
  VinculoCategoriaPromocaoCalculavel,
  VinculoMarcaPromocaoCalculavel,
  VinculoProdutoPromocaoCalculavel,
} from "../types/promocoes.types";

type ProdutoPromocaoBanco = typeof regrasPromocaoProdutosTable.$inferSelect;
type CategoriaPromocaoBanco = typeof regrasPromocaoCategoriasTable.$inferSelect;
type MarcaPromocaoBanco = typeof regrasPromocaoMarcasTable.$inferSelect;
type SubtotalPromocaoBanco = typeof regrasPromocaoSubtotaisTable.$inferSelect;
type FreteGratisPromocaoBanco =
  typeof regrasPromocaoFretesGratisTable.$inferSelect;
type UsoCupomPromocaoBanco = typeof usosCuponsPromocaoTable.$inferSelect;
type CupomPromocaoBanco = typeof cuponsPromocaoTable.$inferSelect & {
  usos?: UsoCupomPromocaoBanco[];
};
type RegraPromocaoBanco = typeof regrasPromocaoTable.$inferSelect & {
  produtos?: ProdutoPromocaoBanco[];
  categorias?: CategoriaPromocaoBanco[];
  marcas?: MarcaPromocaoBanco[];
  subtotais?: SubtotalPromocaoBanco[];
  fretesGratis?: FreteGratisPromocaoBanco[];
};

export type ClienteBancoPromocoes = {
  query: {
    regrasPromocaoTable: {
      findMany: (entrada: unknown) => Promise<RegraPromocaoBanco[]>;
    };
    cuponsPromocaoTable: {
      findMany: (entrada: unknown) => Promise<CupomPromocaoBanco[]>;
    };
  };
};

export type ResultadoBuscaPromocoesValidas = {
  dataReferencia: Date;
  regras: RegraPromocaoCalculavel[];
  produtosPromocao: VinculoProdutoPromocaoCalculavel[];
  categoriasPromocao: VinculoCategoriaPromocaoCalculavel[];
  marcasPromocao: VinculoMarcaPromocaoCalculavel[];
  subtotaisPromocao: RegraSubtotalPromocaoCalculavel[];
  fretesGratisPromocao: RegraFreteGratisPromocaoCalculavel[];
  cuponsPromocao: CupomPromocaoCalculavel[];
};

export type OpcoesBuscaPromocoesValidas = {
  dataReferencia?: Date;
  codigosCupons?: string[];
  clienteId?: string | null;
  clienteBanco?: ClienteBancoPromocoes;
};

async function obterClienteBancoPromocoes(
  clienteBanco?: ClienteBancoPromocoes,
): Promise<ClienteBancoPromocoes> {
  if (clienteBanco) {
    return clienteBanco;
  }

  const { db } = await import("../../../db/connection");
  return db as unknown as ClienteBancoPromocoes;
}

function mapearRegraPromocao(
  regra: RegraPromocaoBanco,
): RegraPromocaoCalculavel {
  return {
    id: regra.id,
    nome: regra.nome,
    slug: regra.slug,
    status: regra.status,
    tipoBeneficio: regra.tipoBeneficio ?? "desconto",
    tipoCampanha: regra.tipoCampanha,
    tipoDesconto: regra.tipoDesconto,
    prioridade: regra.prioridade,
    acumulativa: regra.acumulativa,
    dataInicio: regra.dataInicio,
    dataFim: regra.dataFim,
    badgePromocional: regra.badgePromocional,
    countdownPromocionalDataFim: regra.countdownPromocionalDataFim,
  };
}

function mapearProdutoPromocao(
  produtoPromocao: ProdutoPromocaoBanco,
): VinculoProdutoPromocaoCalculavel {
  return {
    id: produtoPromocao.id,
    regraPromocaoId: produtoPromocao.regraPromocaoId,
    produtoId: produtoPromocao.produtoId,
    modalidade: produtoPromocao.modalidade,
    tipoDesconto: produtoPromocao.tipoDesconto,
    valorDesconto: produtoPromocao.valorDesconto,
  };
}

function mapearCategoriaPromocao(
  categoriaPromocao: CategoriaPromocaoBanco,
): VinculoCategoriaPromocaoCalculavel {
  return {
    id: categoriaPromocao.id,
    regraPromocaoId: categoriaPromocao.regraPromocaoId,
    categoriaId: categoriaPromocao.categoriaId,
    tipoDesconto: categoriaPromocao.tipoDesconto,
    valorDesconto: categoriaPromocao.valorDesconto,
  };
}

function mapearMarcaPromocao(
  marcaPromocao: MarcaPromocaoBanco,
): VinculoMarcaPromocaoCalculavel {
  return {
    id: marcaPromocao.id,
    regraPromocaoId: marcaPromocao.regraPromocaoId,
    marcaId: marcaPromocao.marcaId,
    tipoDesconto: marcaPromocao.tipoDesconto,
    valorDesconto: marcaPromocao.valorDesconto,
  };
}

function mapearSubtotalPromocao(
  subtotalPromocao: SubtotalPromocaoBanco,
): RegraSubtotalPromocaoCalculavel {
  return {
    id: subtotalPromocao.id,
    regraPromocaoId: subtotalPromocao.regraPromocaoId,
    subtotalMinimo: subtotalPromocao.subtotalMinimo,
    subtotalMaximo: subtotalPromocao.subtotalMaximo,
    tipoDesconto: subtotalPromocao.tipoDesconto,
    valorDesconto: subtotalPromocao.valorDesconto,
  };
}

function mapearFreteGratisPromocao(
  freteGratisPromocao: FreteGratisPromocaoBanco,
): RegraFreteGratisPromocaoCalculavel {
  return {
    id: freteGratisPromocao.id,
    regraPromocaoId: freteGratisPromocao.regraPromocaoId,
    subtotalMinimo: freteGratisPromocao.subtotalMinimo,
    modalidade: freteGratisPromocao.modalidade,
    mensagemProgressiva: freteGratisPromocao.mensagemProgressiva,
    regiaoCodigo: freteGratisPromocao.regiaoCodigo,
    transportadoraCodigo: freteGratisPromocao.transportadoraCodigo,
    servicoCodigo: freteGratisPromocao.servicoCodigo,
  };
}

function mapearCupomPromocao(
  cupomPromocao: CupomPromocaoBanco,
  clienteId?: string | null,
): CupomPromocaoCalculavel {
  return {
    id: cupomPromocao.id,
    codigo: cupomPromocao.codigo,
    nome: cupomPromocao.nome,
    ativo: cupomPromocao.ativo,
    tipoDesconto: cupomPromocao.tipoDesconto,
    valorDesconto: cupomPromocao.valorDesconto,
    freteGratis: cupomPromocao.freteGratis,
    prioridade: cupomPromocao.prioridade,
    acumulativo: cupomPromocao.acumulativo,
    subtotalMinimo: cupomPromocao.subtotalMinimo,
    limiteUsoTotal: cupomPromocao.limiteUsoTotal,
    limiteUsoPorCliente: cupomPromocao.limiteUsoPorCliente,
    totalUsos: cupomPromocao.totalUsos,
    usosCliente: clienteId
      ? (cupomPromocao.usos ?? []).filter((uso) => uso.clienteId === clienteId)
          .length
      : 0,
    dataInicio: cupomPromocao.dataInicio,
    dataFim: cupomPromocao.dataFim,
  };
}

function removerDuplicidadePorId<T extends { id: string }>(itens: T[]): T[] {
  return [...new Map(itens.map((item) => [item.id, item])).values()];
}

function regraPromocaoBancoValida(
  regra: RegraPromocaoBanco,
  dataReferencia: Date,
): boolean {
  if (regra.status !== "ativa") {
    return false;
  }

  if (regra.dataInicio > dataReferencia) {
    return false;
  }

  if (regra.dataFim && regra.dataFim < dataReferencia) {
    return false;
  }

  return (
    (regra.produtos ?? []).length > 0 ||
    (regra.categorias ?? []).length > 0 ||
    (regra.marcas ?? []).length > 0 ||
    (regra.subtotais ?? []).length > 0 ||
    (regra.fretesGratis ?? []).length > 0
  );
}

export async function buscarPromocoesValidas(
  opcoes: OpcoesBuscaPromocoesValidas = {},
): Promise<ResultadoBuscaPromocoesValidas> {
  const dataReferencia = opcoes.dataReferencia ?? new Date();
  const codigosCupons = [
    ...new Set(
      (opcoes.codigosCupons ?? [])
        .map((codigo) => codigo.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  const clienteBanco = await obterClienteBancoPromocoes(opcoes.clienteBanco);
  const [regrasEncontradas, cuponsEncontrados] = await Promise.all([
    clienteBanco.query.regrasPromocaoTable.findMany({
      where: and(
        eq(regrasPromocaoTable.status, "ativa"),
        lte(regrasPromocaoTable.dataInicio, dataReferencia),
        or(
          isNull(regrasPromocaoTable.dataFim),
          gte(regrasPromocaoTable.dataFim, dataReferencia),
        ),
      ),
      with: {
        produtos: true,
        categorias: true,
        marcas: true,
        subtotais: true,
        fretesGratis: true,
      },
      orderBy: [
        desc(regrasPromocaoTable.prioridade),
        asc(regrasPromocaoTable.dataInicio),
      ],
    }),
    codigosCupons.length > 0
      ? clienteBanco.query.cuponsPromocaoTable.findMany({
          where: and(
            eq(cuponsPromocaoTable.ativo, true),
            inArray(cuponsPromocaoTable.codigo, codigosCupons),
            lte(cuponsPromocaoTable.dataInicio, dataReferencia),
            or(
              isNull(cuponsPromocaoTable.dataFim),
              gte(cuponsPromocaoTable.dataFim, dataReferencia),
            ),
          ),
          with: {
            usos: opcoes.clienteId
              ? {
                  where: eq(
                    usosCuponsPromocaoTable.clienteId,
                    opcoes.clienteId,
                  ),
                }
              : true,
          },
          orderBy: [
            desc(cuponsPromocaoTable.prioridade),
            asc(cuponsPromocaoTable.dataInicio),
          ],
        })
      : Promise.resolve([]),
  ]);

  const regrasUtilizaveis = regrasEncontradas.filter((regra) =>
    regraPromocaoBancoValida(regra, dataReferencia),
  );

  return {
    dataReferencia,
    regras: removerDuplicidadePorId(regrasUtilizaveis.map(mapearRegraPromocao)),
    produtosPromocao: removerDuplicidadePorId(
      regrasUtilizaveis.flatMap((regra) =>
        (regra.produtos ?? []).map(mapearProdutoPromocao),
      ),
    ),
    categoriasPromocao: removerDuplicidadePorId(
      regrasUtilizaveis.flatMap((regra) =>
        (regra.categorias ?? []).map(mapearCategoriaPromocao),
      ),
    ),
    marcasPromocao: removerDuplicidadePorId(
      regrasUtilizaveis.flatMap((regra) =>
        (regra.marcas ?? []).map(mapearMarcaPromocao),
      ),
    ),
    subtotaisPromocao: removerDuplicidadePorId(
      regrasUtilizaveis.flatMap((regra) =>
        (regra.subtotais ?? []).map(mapearSubtotalPromocao),
      ),
    ),
    fretesGratisPromocao: removerDuplicidadePorId(
      regrasUtilizaveis.flatMap((regra) =>
        (regra.fretesGratis ?? []).map(mapearFreteGratisPromocao),
      ),
    ),
    cuponsPromocao: removerDuplicidadePorId(
      cuponsEncontrados.map((cupom) =>
        mapearCupomPromocao(cupom, opcoes.clienteId),
      ),
    ),
  };
}
