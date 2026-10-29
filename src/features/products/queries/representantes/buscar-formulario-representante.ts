import "server-only";

import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  autorizacoesProdutosRepresentantesTable,
  categoryTable,
  fornecedoresTable,
  fornecedorProdutoVinculosTable,
  identificadoresCatalogoTable,
  marcaTable,
  productAttributeTable,
  productGalleryImagesTable,
  productPricingTable,
  productTable,
  productVariantTable,
  representantesFornecedoresTable,
} from "@/db/schema";

import { validarEstruturaProdutoRepresentante } from "../../lib/representantes/validar-estrutura-produto-representante";
import type { ProdutoRepresentanteEdicao } from "../../types/representantes/produto-representante.types";
import {
  exigirLeituraProdutoAdmin,
  exigirLeituraProdutosAdmin,
} from "../autorizacao/escopo-produtos-admin";

/** Somente opções já existentes: não concede nenhum CRUD de categoria ou marca. */
export async function buscarOpcoesFormularioRepresentante() {
  await exigirLeituraProdutosAdmin();
  const [categorias, marcas] = await Promise.all([
    db
      .select({
        id: categoryTable.id,
        nome: categoryTable.name,
        parentId: categoryTable.parentId,
      })
      .from(categoryTable)
      .where(eq(categoryTable.isActive, true))
      .orderBy(categoryTable.name),
    db
      .select({ id: marcaTable.id, nome: marcaTable.nome })
      .from(marcaTable)
      .where(eq(marcaTable.ativo, true))
      .orderBy(marcaTable.nome),
  ]);
  return { categorias, marcas };
}
export async function buscarProdutoEdicaoRepresentante(
  entrada: unknown,
): Promise<ProdutoRepresentanteEdicao> {
  const { produtoId, fornecedorId } = z
    .object({ produtoId: z.uuid(), fornecedorId: z.uuid() })
    .strict()
    .parse(entrada);
  const { contexto } = await exigirLeituraProdutoAdmin(produtoId);
  if (!contexto.representanteFornecedor || contexto.administradorPrincipal)
    throw new Error("Use o formulário administrativo.");
  const [liberacao] = await db
    .select({ id: autorizacoesProdutosRepresentantesTable.id })
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
      eq(fornecedoresTable.id, representantesFornecedoresTable.fornecedorId),
    )
    .where(
      and(
        eq(autorizacoesProdutosRepresentantesTable.produtoId, produtoId),
        eq(autorizacoesProdutosRepresentantesTable.ativa, true),
        eq(representantesFornecedoresTable.usuarioId, contexto.userId),
        eq(representantesFornecedoresTable.ativo, true),
        eq(fornecedoresTable.id, fornecedorId),
        eq(fornecedoresTable.status, "ativo"),
      ),
    )
    .limit(1);
  if (!liberacao) throw new Error("Acesso ao produto indisponível.");
  const [produto] = await db
    .select()
    .from(productTable)
    .where(eq(productTable.id, produtoId));
  const [precos, variantes, atributos, imagens, comerciais] = await Promise.all(
    [
      db
        .select()
        .from(productPricingTable)
        .where(eq(productPricingTable.productId, produtoId)),
      db
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, produtoId)),
      db
        .select({ id: productAttributeTable.id })
        .from(productAttributeTable)
        .where(eq(productAttributeTable.productId, produtoId)),
      db
        .select()
        .from(productGalleryImagesTable)
        .where(eq(productGalleryImagesTable.productId, produtoId))
        .orderBy(
          productGalleryImagesTable.sortOrder,
          productGalleryImagesTable.id,
        ),
      db
        .select()
        .from(fornecedorProdutoVinculosTable)
        .where(
          and(
            eq(fornecedorProdutoVinculosTable.produtoId, produtoId),
            eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedorId),
          ),
        ),
    ],
  );
  const varianteId = validarEstruturaProdutoRepresentante({
    produto,
    precos,
    variantes,
    quantidadeAtributos: atributos.length,
  });
  if (comerciais.length !== 1 || comerciais[0].status !== "ativo")
    throw new Error(
      "Vínculo comercial indisponível. Solicite revisão ao gestor.",
    );
  const identificadores = await db
    .select()
    .from(identificadoresCatalogoTable)
    .where(
      and(
        eq(identificadoresCatalogoTable.principal, true),
        inArray(identificadoresCatalogoTable.tipo, ["gtin", "mpn"]),
        or(
          eq(identificadoresCatalogoTable.produtoId, produtoId),
          eq(identificadoresCatalogoTable.varianteId, varianteId),
        ),
      ),
    );
  return {
    id: produtoId,
    sku: produto.sku,
    versao: produto.updatedAt.toISOString(),
    imagens: imagens.map((i) => ({
      id: i.id,
      url: i.imageUrl,
      alt: i.altText ?? "",
      principal: !!i.isPrimary,
    })),
    dados: {
      nome: produto.name,
      categoriaId: produto.categoryId,
      marcaId: produto.marcaId,
      descricao: produto.description,
      codigoFornecedor: comerciais[0].codigoFornecedor ?? "",
      precoCentavos: precos[0].price,
      estoque: comerciais[0].estoqueInformadoFornecedor,
      prazo: precos[0].deliveryDays ?? "",
      gtin:
        identificadores.find(
          (i) => i.tipo === "gtin" && i.varianteId === varianteId,
        )?.valor ?? "",
      mpn:
        identificadores.find(
          (i) => i.tipo === "mpn" && i.produtoId === produtoId,
        )?.valor ?? "",
      ncm: produto.ncmCode ?? "",
      pesoGramas: produto.weight,
      alturaCm: produto.height,
      larguraCm: produto.width,
      comprimentoCm: produto.length,
      garantiaDias: produto.warrantyPeriod,
      garantiaResponsavel: produto.warrantyProvider ?? "",
      slug: produto.slug,
      metaTitulo: produto.metaTitle ?? "",
      metaDescricao: produto.metaDescription ?? "",
      productKind: "simple",
      modalidade: "dropshipping",
    },
  };
}
