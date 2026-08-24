"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  categoryTable,
  marcaTable,
  productTable,
  productVariantTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

const produtoIdSchema = z.string().uuid();

function camposPositivos(...valores: Array<number | null>) {
  return valores.every((valor) => typeof valor === "number" && valor > 0);
}

export async function publicarProdutoAdmin(produtoId: string) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.PUBLICAR);

  const idValidado = produtoIdSchema.safeParse(produtoId);
  if (!idValidado.success) {
    return { sucesso: false as const, erro: "Produto inválido." };
  }

  try {
    const produto = await db.query.productTable.findFirst({
      where: eq(productTable.id, idValidado.data),
      with: { pricing: true, variants: true },
    });
    if (!produto) {
      return { sucesso: false as const, erro: "Produto não encontrado." };
    }

    if (
      !produto.name.trim() ||
      !produto.slug.trim() ||
      !produto.description.trim() ||
      !produto.sku.trim()
    ) {
      return {
        sucesso: false as const,
        erro: "Preencha nome, slug, descrição e SKU antes de publicar.",
      };
    }

    const [categoria] = await db
      .select({ id: categoryTable.id, slug: categoryTable.slug })
      .from(categoryTable)
      .where(
        and(
          eq(categoryTable.id, produto.categoryId),
          eq(categoryTable.isActive, true),
        ),
      )
      .limit(1);
    const [marca] = await db
      .select({ id: marcaTable.id })
      .from(marcaTable)
      .where(
        and(eq(marcaTable.id, produto.marcaId), eq(marcaTable.ativo, true)),
      )
      .limit(1);
    if (!categoria || !marca) {
      return {
        sucesso: false as const,
        erro: "Selecione uma categoria e uma marca ativas antes de publicar.",
      };
    }

    // O SKU não pode colidir com OUTRO produto nem com a variante de OUTRO
    // produto. As variantes do próprio produto são ignoradas de propósito:
    // todo produto simples nasce com uma variante técnica que reusa o mesmo
    // SKU, e considerá-la conflito impediria qualquer publicação.
    const [produtoComMesmoSku] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(
        and(eq(productTable.sku, produto.sku), ne(productTable.id, produto.id)),
      )
      .limit(1);

    const [varianteComMesmoSku] = await db
      .select({ id: productVariantTable.id })
      .from(productVariantTable)
      .where(
        and(
          eq(productVariantTable.sku, produto.sku),
          ne(productVariantTable.productId, produto.id),
        ),
      )
      .limit(1);

    if (produtoComMesmoSku || varianteComMesmoSku) {
      return {
        sucesso: false as const,
        erro: "O SKU informado já está em uso.",
      };
    }

    if (produto.productKind === "variable") {
      const variantesAtivas = produto.variants.filter(
        (variante) => variante.isActive,
      );
      const variantesValidas = variantesAtivas.every(
        (variante) =>
          variante.sku.trim() &&
          variante.priceInCents > 0 &&
          variante.stockQuantity >= 0 &&
          camposPositivos(
            variante.weightInGrams,
            variante.heightInCm,
            variante.widthInCm,
            variante.lengthInCm,
          ),
      );
      const variantesPadrao = produto.variants.filter(
        (variante) => variante.isDefault,
      ).length;

      if (
        variantesAtivas.length === 0 ||
        !variantesValidas ||
        variantesPadrao !== 1
      ) {
        return {
          sucesso: false as const,
          erro: "Complete SKU, preço, estoque, peso, dimensões e variante padrão antes de publicar.",
        };
      }
    } else {
      const possuiPrecoAtivo = produto.pricing.some(
        (preco) => preco.isActive && preco.price > 0,
      );
      if (!possuiPrecoAtivo && !(produto.salePrice && produto.salePrice > 0)) {
        return {
          sucesso: false as const,
          erro: "Informe um preço ativo antes de publicar.",
        };
      }
    }

    await db
      .update(productTable)
      .set({ status: "published", isActive: true, updatedAt: new Date() })
      .where(eq(productTable.id, produto.id));

    revalidatePath("/");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${produto.id}/edit`);
    revalidatePath(`/category/${categoria.slug}`);
    revalidatePath(`/product/${produto.slug}`);
    return { sucesso: true as const };
  } catch (erro) {
    console.error("[publicarProdutoAdmin] Falha ao publicar produto", {
      produtoId: idValidado.data,
      tipo: erro instanceof Error ? erro.constructor.name : "ErroDesconhecido",
    });
    return {
      sucesso: false as const,
      erro: "Não foi possível publicar o produto.",
    };
  }
}
