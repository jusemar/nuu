import "server-only";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import {
  categoryTable,
  marcaTable,
  productGalleryImagesTable,
  productPricingTable,
  productTable,
  regrasPromocaoCategoriasTable,
  regrasPromocaoFretesGratisTable,
  regrasPromocaoMarcasTable,
  regrasPromocaoProdutosTable,
  regrasPromocaoSubtotaisTable,
  regrasPromocaoTable,
} from "../../../db/schema";
import { filtrosPromocoesAdminSchema } from "../schemas";
import type {
  CategoriaPromocaoAdmin,
  FreteGratisPromocaoAdmin,
  MarcaPromocaoAdmin,
  ProdutoPromocaoAdmin,
  PromocaoAdmin,
  ResultadoPromocoesAdmin,
  SubtotalPromocaoAdmin,
  StatusPromocao,
} from "../types";

type FiltrosPromocoesAdmin = {
  busca?: string;
  status?: string;
  pagina?: number;
  limite?: number;
};

function criarCondicoesPromocoes(filtros: FiltrosPromocoesAdmin) {
  const condicoes = [];

  if (filtros.busca) {
    condicoes.push(
      or(
        ilike(regrasPromocaoTable.nome, `%${filtros.busca}%`),
        ilike(regrasPromocaoTable.slug, `%${filtros.busca}%`),
      ),
    );
  }

  if (filtros.status && filtros.status !== "todos") {
    condicoes.push(
      eq(regrasPromocaoTable.status, filtros.status as StatusPromocao),
    );
  }

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

async function buscarProdutosPorPromocao(promocoesIds: string[]): Promise<{
  produtosPorPromocao: Map<string, ProdutoPromocaoAdmin[]>;
  valorDescontoPorPromocao: Map<string, number>;
}> {
  if (promocoesIds.length === 0) {
    return {
      produtosPorPromocao: new Map(),
      valorDescontoPorPromocao: new Map(),
    };
  }

  const linhas = await db
    .select({
      regraPromocaoId: regrasPromocaoProdutosTable.regraPromocaoId,
      modalidade: regrasPromocaoProdutosTable.modalidade,
      valorDesconto: regrasPromocaoProdutosTable.valorDesconto,
      produtoId: productTable.id,
      nome: productTable.name,
      slug: productTable.slug,
      sku: productTable.sku,
      imagemUrl: productGalleryImagesTable.imageUrl,
      precoAtualEmCentavos: productPricingTable.price,
      modalidadeDisponivel: productPricingTable.type,
    })
    .from(regrasPromocaoProdutosTable)
    .innerJoin(
      productTable,
      eq(regrasPromocaoProdutosTable.produtoId, productTable.id),
    )
    .leftJoin(
      productGalleryImagesTable,
      eq(productGalleryImagesTable.productId, productTable.id),
    )
    .leftJoin(
      productPricingTable,
      eq(productPricingTable.productId, productTable.id),
    )
    .where(inArray(regrasPromocaoProdutosTable.regraPromocaoId, promocoesIds));

  const produtosPorPromocao = new Map<string, ProdutoPromocaoAdmin[]>();
  const valorDescontoPorPromocao = new Map<string, number>();
  const produtosIncluidos = new Set<string>();
  const modalidadesPorProduto = new Map<string, Set<string>>();

  linhas.forEach((linha) => {
    const chaveProduto = `${linha.regraPromocaoId}:${linha.produtoId}`;
    const modalidades = modalidadesPorProduto.get(chaveProduto) ?? new Set();

    if (linha.modalidadeDisponivel) {
      modalidades.add(linha.modalidadeDisponivel);
    }

    modalidadesPorProduto.set(chaveProduto, modalidades);
  });

  linhas.forEach((linha) => {
    if (!valorDescontoPorPromocao.has(linha.regraPromocaoId)) {
      valorDescontoPorPromocao.set(linha.regraPromocaoId, linha.valorDesconto);
    }

    const chaveProduto = `${linha.regraPromocaoId}:${linha.produtoId}:${linha.modalidade ?? "todas"}`;

    if (produtosIncluidos.has(chaveProduto)) {
      return;
    }

    produtosIncluidos.add(chaveProduto);

    const produtosAtuais = produtosPorPromocao.get(linha.regraPromocaoId) ?? [];
    produtosAtuais.push({
      id: linha.produtoId,
      nome: linha.nome,
      slug: linha.slug,
      sku: linha.sku,
      imagemUrl: linha.imagemUrl,
      precoAtualEmCentavos: linha.precoAtualEmCentavos,
      modalidade: linha.modalidade,
      modalidadesDisponiveis: linha.modalidadeDisponivel
        ? [
            ...((modalidadesPorProduto.get(
              `${linha.regraPromocaoId}:${linha.produtoId}`,
            ) ?? new Set<string>()) as Set<string>),
          ]
        : [],
    });
    produtosPorPromocao.set(linha.regraPromocaoId, produtosAtuais);
  });

  return {
    produtosPorPromocao,
    valorDescontoPorPromocao,
  };
}

async function buscarCategoriasPorPromocao(promocoesIds: string[]): Promise<{
  categoriasPorPromocao: Map<string, CategoriaPromocaoAdmin[]>;
  valorDescontoPorPromocao: Map<string, number>;
}> {
  if (promocoesIds.length === 0) {
    return {
      categoriasPorPromocao: new Map(),
      valorDescontoPorPromocao: new Map(),
    };
  }

  const linhas = await db
    .select({
      regraPromocaoId: regrasPromocaoCategoriasTable.regraPromocaoId,
      valorDesconto: regrasPromocaoCategoriasTable.valorDesconto,
      categoriaId: categoryTable.id,
      nome: categoryTable.name,
      slug: categoryTable.slug,
    })
    .from(regrasPromocaoCategoriasTable)
    .innerJoin(
      categoryTable,
      eq(regrasPromocaoCategoriasTable.categoriaId, categoryTable.id),
    )
    .where(
      inArray(regrasPromocaoCategoriasTable.regraPromocaoId, promocoesIds),
    );

  const categoriasPorPromocao = new Map<string, CategoriaPromocaoAdmin[]>();
  const valorDescontoPorPromocao = new Map<string, number>();

  linhas.forEach((linha) => {
    if (!valorDescontoPorPromocao.has(linha.regraPromocaoId)) {
      valorDescontoPorPromocao.set(linha.regraPromocaoId, linha.valorDesconto);
    }

    const categoriasAtuais =
      categoriasPorPromocao.get(linha.regraPromocaoId) ?? [];
    categoriasAtuais.push({
      id: linha.categoriaId,
      nome: linha.nome,
      slug: linha.slug,
    });
    categoriasPorPromocao.set(linha.regraPromocaoId, categoriasAtuais);
  });

  return {
    categoriasPorPromocao,
    valorDescontoPorPromocao,
  };
}

async function buscarMarcasPorPromocao(promocoesIds: string[]): Promise<{
  marcasPorPromocao: Map<string, MarcaPromocaoAdmin[]>;
  valorDescontoPorPromocao: Map<string, number>;
}> {
  if (promocoesIds.length === 0) {
    return {
      marcasPorPromocao: new Map(),
      valorDescontoPorPromocao: new Map(),
    };
  }

  const linhas = await db
    .select({
      regraPromocaoId: regrasPromocaoMarcasTable.regraPromocaoId,
      valorDesconto: regrasPromocaoMarcasTable.valorDesconto,
      marcaId: marcaTable.id,
      nome: marcaTable.nome,
      slug: marcaTable.slug,
      logoUrl: marcaTable.logoUrl,
    })
    .from(regrasPromocaoMarcasTable)
    .innerJoin(marcaTable, eq(regrasPromocaoMarcasTable.marcaId, marcaTable.id))
    .where(inArray(regrasPromocaoMarcasTable.regraPromocaoId, promocoesIds));

  const marcasPorPromocao = new Map<string, MarcaPromocaoAdmin[]>();
  const valorDescontoPorPromocao = new Map<string, number>();

  linhas.forEach((linha) => {
    if (!valorDescontoPorPromocao.has(linha.regraPromocaoId)) {
      valorDescontoPorPromocao.set(linha.regraPromocaoId, linha.valorDesconto);
    }

    const marcasAtuais = marcasPorPromocao.get(linha.regraPromocaoId) ?? [];
    marcasAtuais.push({
      id: linha.marcaId,
      nome: linha.nome,
      slug: linha.slug,
      logoUrl: linha.logoUrl,
    });
    marcasPorPromocao.set(linha.regraPromocaoId, marcasAtuais);
  });

  return {
    marcasPorPromocao,
    valorDescontoPorPromocao,
  };
}

async function buscarSubtotaisPorPromocao(promocoesIds: string[]): Promise<{
  subtotaisPorPromocao: Map<string, SubtotalPromocaoAdmin[]>;
  valorDescontoPorPromocao: Map<string, number>;
}> {
  if (promocoesIds.length === 0) {
    return {
      subtotaisPorPromocao: new Map(),
      valorDescontoPorPromocao: new Map(),
    };
  }

  const linhas = await db
    .select({
      regraPromocaoId: regrasPromocaoSubtotaisTable.regraPromocaoId,
      id: regrasPromocaoSubtotaisTable.id,
      valorDesconto: regrasPromocaoSubtotaisTable.valorDesconto,
      subtotalMinimo: regrasPromocaoSubtotaisTable.subtotalMinimo,
      subtotalMaximo: regrasPromocaoSubtotaisTable.subtotalMaximo,
    })
    .from(regrasPromocaoSubtotaisTable)
    .where(inArray(regrasPromocaoSubtotaisTable.regraPromocaoId, promocoesIds));

  const subtotaisPorPromocao = new Map<string, SubtotalPromocaoAdmin[]>();
  const valorDescontoPorPromocao = new Map<string, number>();

  linhas.forEach((linha) => {
    if (!valorDescontoPorPromocao.has(linha.regraPromocaoId)) {
      valorDescontoPorPromocao.set(linha.regraPromocaoId, linha.valorDesconto);
    }

    const subtotaisAtuais =
      subtotaisPorPromocao.get(linha.regraPromocaoId) ?? [];
    subtotaisAtuais.push({
      id: linha.id,
      subtotalMinimo: linha.subtotalMinimo,
      subtotalMaximo: linha.subtotalMaximo,
    });
    subtotaisPorPromocao.set(linha.regraPromocaoId, subtotaisAtuais);
  });

  return {
    subtotaisPorPromocao,
    valorDescontoPorPromocao,
  };
}

async function buscarFretesGratisPorPromocao(promocoesIds: string[]): Promise<{
  fretesGratisPorPromocao: Map<string, FreteGratisPromocaoAdmin[]>;
}> {
  if (promocoesIds.length === 0) {
    return {
      fretesGratisPorPromocao: new Map(),
    };
  }

  const linhas = await db
    .select({
      regraPromocaoId: regrasPromocaoFretesGratisTable.regraPromocaoId,
      id: regrasPromocaoFretesGratisTable.id,
      subtotalMinimo: regrasPromocaoFretesGratisTable.subtotalMinimo,
      modalidade: regrasPromocaoFretesGratisTable.modalidade,
      mensagemProgressiva: regrasPromocaoFretesGratisTable.mensagemProgressiva,
      regiaoCodigo: regrasPromocaoFretesGratisTable.regiaoCodigo,
      transportadoraCodigo:
        regrasPromocaoFretesGratisTable.transportadoraCodigo,
      servicoCodigo: regrasPromocaoFretesGratisTable.servicoCodigo,
    })
    .from(regrasPromocaoFretesGratisTable)
    .where(
      inArray(regrasPromocaoFretesGratisTable.regraPromocaoId, promocoesIds),
    );

  const fretesGratisPorPromocao = new Map<string, FreteGratisPromocaoAdmin[]>();

  linhas.forEach((linha) => {
    const fretesAtuais =
      fretesGratisPorPromocao.get(linha.regraPromocaoId) ?? [];
    fretesAtuais.push({
      id: linha.id,
      subtotalMinimo: linha.subtotalMinimo,
      modalidade: linha.modalidade,
      mensagemProgressiva: linha.mensagemProgressiva,
      regiaoCodigo: linha.regiaoCodigo,
      transportadoraCodigo: linha.transportadoraCodigo,
      servicoCodigo: linha.servicoCodigo,
    });
    fretesGratisPorPromocao.set(linha.regraPromocaoId, fretesAtuais);
  });

  return {
    fretesGratisPorPromocao,
  };
}

function mapearPromocaoAdmin(
  promocao: typeof regrasPromocaoTable.$inferSelect,
  produtos: ProdutoPromocaoAdmin[],
  categorias: CategoriaPromocaoAdmin[],
  marcas: MarcaPromocaoAdmin[],
  subtotais: SubtotalPromocaoAdmin[],
  fretesGratis: FreteGratisPromocaoAdmin[],
): PromocaoAdmin {
  return {
    id: promocao.id,
    nome: promocao.nome,
    slug: promocao.slug,
    status: promocao.status,
    tipoBeneficio: promocao.tipoBeneficio,
    tipoCampanha: promocao.tipoCampanha,
    tipoDesconto: promocao.tipoDesconto,
    valorDesconto: produtos.length > 0 ? 0 : 0,
    prioridade: promocao.prioridade,
    acumulativa: promocao.acumulativa,
    dataInicio: promocao.dataInicio,
    dataFim: promocao.dataFim,
    badgePromocional: promocao.badgePromocional,
    countdownPromocionalDataFim: promocao.countdownPromocionalDataFim,
    criadoEm: promocao.criadoEm,
    atualizadoEm: promocao.atualizadoEm,
    quantidadeProdutos: produtos.length,
    quantidadeCategorias: categorias.length,
    quantidadeMarcas: marcas.length,
    possuiRegraSubtotal: subtotais.length > 0,
    produtos,
    categorias,
    marcas,
    subtotais,
    fretesGratis,
  };
}

export async function listarPromocoesAdmin(
  filtrosEntrada: FiltrosPromocoesAdmin = {},
): Promise<ResultadoPromocoesAdmin> {
  const filtros = filtrosPromocoesAdminSchema.parse(filtrosEntrada);
  const condicoes = criarCondicoesPromocoes(filtros);
  const deslocamento = (filtros.pagina - 1) * filtros.limite;

  const [totalResultado, promocoes] = await Promise.all([
    db.select({ total: count() }).from(regrasPromocaoTable).where(condicoes),
    db
      .select()
      .from(regrasPromocaoTable)
      .where(condicoes)
      .orderBy(
        desc(regrasPromocaoTable.prioridade),
        desc(regrasPromocaoTable.atualizadoEm),
      )
      .limit(filtros.limite)
      .offset(deslocamento),
  ]);

  const promocoesIds = promocoes.map((promocao) => promocao.id);
  const [
    { produtosPorPromocao, valorDescontoPorPromocao },
    categoriasResultado,
    marcasResultado,
    subtotaisResultado,
    fretesGratisResultado,
  ] = await Promise.all([
    buscarProdutosPorPromocao(promocoesIds),
    buscarCategoriasPorPromocao(promocoesIds),
    buscarMarcasPorPromocao(promocoesIds),
    buscarSubtotaisPorPromocao(promocoesIds),
    buscarFretesGratisPorPromocao(promocoesIds),
  ]);

  const promocoesMapeadas = promocoes.map((promocao) => {
    const produtos = produtosPorPromocao.get(promocao.id) ?? [];
    const categorias =
      categoriasResultado.categoriasPorPromocao.get(promocao.id) ?? [];
    const marcas = marcasResultado.marcasPorPromocao.get(promocao.id) ?? [];
    const subtotais =
      subtotaisResultado.subtotaisPorPromocao.get(promocao.id) ?? [];
    const fretesGratis =
      fretesGratisResultado.fretesGratisPorPromocao.get(promocao.id) ?? [];
    const valorDesconto =
      valorDescontoPorPromocao.get(promocao.id) ??
      categoriasResultado.valorDescontoPorPromocao.get(promocao.id) ??
      marcasResultado.valorDescontoPorPromocao.get(promocao.id) ??
      subtotaisResultado.valorDescontoPorPromocao.get(promocao.id) ??
      0;

    return {
      ...mapearPromocaoAdmin(
        promocao,
        produtos,
        categorias,
        marcas,
        subtotais,
        fretesGratis,
      ),
      valorDesconto:
        promocao.tipoBeneficio === "frete_gratis" ? 0 : valorDesconto,
    };
  });

  return {
    promocoes: promocoesMapeadas,
    total: totalResultado[0]?.total ?? 0,
    pagina: filtros.pagina,
    limite: filtros.limite,
    totalPaginas: Math.max(
      1,
      Math.ceil((totalResultado[0]?.total ?? 0) / filtros.limite),
    ),
  };
}
