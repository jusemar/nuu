import "server-only";

import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  fornecedorProdutoVinculosTable,
  productAttributeTable,
  productGalleryImagesTable,
  productPricingTable,
  productTable,
  productVariantTable,
  representantesFornecedoresTable,
} from "@/db/schema";

import { validarEstruturaProdutoRepresentante } from "../../lib/representantes/validar-estrutura-produto-representante";
import type {
  ContextoProdutoRepresentante,
  ProdutoRepresentanteResumo,
} from "../../types/representantes/produto-representante.types";
import {
  condicaoProdutoAdministrativo,
  exigirLeituraProdutosAdmin,
} from "../autorizacao/escopo-produtos-admin";

export async function listarProdutosRepresentante(entrada: unknown = {}) {
  const filtros = z
    .object({
      busca: z.string().trim().max(200).default(""),
      pagina: z.number().int().min(1).max(100000).default(1),
    })
    .strict()
    .parse(entrada);
  const contexto = await exigirLeituraProdutosAdmin();
  if (!contexto.representanteFornecedor || contexto.administradorPrincipal)
    throw new Error("Use a listagem administrativa.");
  const autorizacoesBase = and(
    eq(representantesFornecedoresTable.usuarioId, contexto.userId),
    eq(representantesFornecedoresTable.ativo, true),
    eq(fornecedoresTable.status, "ativo"),
    eq(autorizacoesProdutosRepresentantesTable.ativa, true),
  );
  const pesquisaCodigo = sql`exists (select 1 from fornecedor_produto_vinculos v join representantes_fornecedores r on r.fornecedor_id=v.fornecedor_id join fornecedores f on f.id=r.fornecedor_id and f.status='ativo' join autorizacoes_produtos_representantes a on a.representante_fornecedor_id=r.id where v.produto_id=${productTable.id} and a.produto_id=v.produto_id and a.ativa=true and r.usuario_id=${contexto.userId} and r.ativo=true and v.status='ativo' and v.codigo_fornecedor ilike ${`%${filtros.busca}%`})`;
  const condicao = and(
    condicaoProdutoAdministrativo(contexto),
    filtros.busca
      ? or(
          ilike(productTable.name, `%${filtros.busca}%`),
          ilike(productTable.sku, `%${filtros.busca}%`),
          pesquisaCodigo,
        )
      : undefined,
  );
  const produtos = await db
    .select()
    .from(productTable)
    .where(condicao)
    .orderBy(desc(productTable.updatedAt), productTable.id)
    .limit(20)
    .offset((filtros.pagina - 1) * 20);
  const [contagem] = await db
    .select({ total: count() })
    .from(productTable)
    .where(condicao);
  if (!produtos.length)
    return {
      produtos: [] as ProdutoRepresentanteResumo[],
      total: contagem.total,
      pagina: filtros.pagina,
      porPagina: 20,
    };
  const ids = produtos.map((p) => p.id);
  const [precos, variantes, atributos, imagens, liberacoes] = await Promise.all(
    [
      db
        .select()
        .from(productPricingTable)
        .where(inArray(productPricingTable.productId, ids)),
      db
        .select()
        .from(productVariantTable)
        .where(inArray(productVariantTable.productId, ids)),
      db
        .select({ produtoId: productAttributeTable.productId })
        .from(productAttributeTable)
        .where(inArray(productAttributeTable.productId, ids)),
      db
        .select()
        .from(productGalleryImagesTable)
        .where(inArray(productGalleryImagesTable.productId, ids))
        .orderBy(
          productGalleryImagesTable.sortOrder,
          productGalleryImagesTable.id,
        ),
      db
        .select({
          produtoId: autorizacoesProdutosRepresentantesTable.produtoId,
          fornecedorId: fornecedoresTable.id,
          comissaoTipo: sql<
            "percentual" | "fixa" | null
          >`case when ${autorizacoesProdutosRepresentantesTable.comissaoVisivel} then ${autorizacoesProdutosRepresentantesTable.comissaoTipo} else null end`,
          comissaoValor: sql<
            number | null
          >`case when ${autorizacoesProdutosRepresentantesTable.comissaoVisivel} then ${autorizacoesProdutosRepresentantesTable.comissaoValor} else null end`,
          comercialId: fornecedorProdutoVinculosTable.id,
          codigo: fornecedorProdutoVinculosTable.codigoFornecedor,
          estoque: fornecedorProdutoVinculosTable.estoqueInformadoFornecedor,
          status: fornecedorProdutoVinculosTable.status,
        })
        .from(autorizacoesProdutosRepresentantesTable)
        .innerJoin(
          representantesFornecedoresTable,
          eq(
            representantesFornecedoresTable.id,
            autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
          ),
        )
        .innerJoin(
          fornecedoresTable,
          eq(
            fornecedoresTable.id,
            representantesFornecedoresTable.fornecedorId,
          ),
        )
        .leftJoin(
          fornecedorProdutoVinculosTable,
          and(
            eq(
              fornecedorProdutoVinculosTable.produtoId,
              autorizacoesProdutosRepresentantesTable.produtoId,
            ),
            eq(
              fornecedorProdutoVinculosTable.fornecedorId,
              fornecedoresTable.id,
            ),
          ),
        )
        .where(
          and(
            autorizacoesBase,
            inArray(autorizacoesProdutosRepresentantesTable.produtoId, ids),
          ),
        ),
    ],
  );
  // Revogação entre a seleção e os filhos não devolve um produto sem autorização atual.
  const linhas: ProdutoRepresentanteResumo[] = produtos.flatMap((produto) => {
    const permitidas = liberacoes.filter((l) => l.produtoId === produto.id);
    if (!permitidas.length) return [];
    const contextos: ContextoProdutoRepresentante[] = [
      ...new Set(permitidas.map((l) => l.fornecedorId)),
    ].map((fornecedorId) => {
      const vinculos = permitidas.filter(
          (l) => l.fornecedorId === fornecedorId,
        ),
        l = vinculos[0];
      return {
        fornecedorId,
        codigoFornecedor: l.codigo ?? "",
        estoque: l.estoque ?? 0,
        comercialValido:
          vinculos.length === 1 && !!l.comercialId && l.status === "ativo",
        comissao:
          l.comissaoTipo && l.comissaoValor !== null
            ? { tipo: l.comissaoTipo, valor: l.comissaoValor }
            : null,
      };
    });
    const modalidades = precos.filter((p) => p.productId === produto.id);
    let editavel = true;
    try {
      validarEstruturaProdutoRepresentante({
        produto,
        precos: modalidades,
        variantes: variantes.filter((v) => v.productId === produto.id),
        quantidadeAtributos: atributos.filter((a) => a.produtoId === produto.id)
          .length,
      });
    } catch {
      editavel = false;
    }
    return [
      {
        id: produto.id,
        nome: produto.name,
        sku: produto.sku,
        versao: produto.updatedAt.toISOString(),
        situacao: produto.status ?? "draft",
        imagem:
          imagens.find((i) => i.productId === produto.id && i.isPrimary)
            ?.imageUrl ??
          imagens.find((i) => i.productId === produto.id)?.imageUrl ??
          null,
        precoCentavos:
          modalidades.length === 1 && modalidades[0].type === "dropshipping"
            ? modalidades[0].price
            : null,
        editavel,
        contextos,
      },
    ];
  });
  return {
    produtos: linhas,
    total: contagem.total,
    pagina: filtros.pagina,
    porPagina: 20,
  };
}
