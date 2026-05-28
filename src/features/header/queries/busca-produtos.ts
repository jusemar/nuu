"use server";

import { db } from "@/db/connection";
import { sql } from "drizzle-orm";

export type CategoriaPrincipalBusca = {
  id: string;
  nome: string;
  slug: string;
};

export type ProdutoAutocomplete = {
  id: string;
  nome: string;
  slug: string;
  categoriaId: string | null;
  categoriaNome: string | null;
  categoriaSlug: string | null;
  precoEmCentavos: number | null;
  imagemUrl: string | null;
};

export type ResultadoBuscaProdutos = {
  produtosEncontrados: ProdutoAutocomplete[];
  sugestoesEncontradas: string[];
};

type ParametrosBuscaProdutos = {
  termoBusca: string;
  categoriaId?: string | null;
};

export async function buscarCategoriasPrincipais(): Promise<
  CategoriaPrincipalBusca[]
> {
  const resultado = await db.execute(sql`
    SELECT id, name, slug
    FROM category
    WHERE parent_id IS NULL
      AND level = 0
      AND is_active = true
    ORDER BY name ASC;
  `);

  return resultado.rows.map((categoria: any) => ({
    id: String(categoria.id),
    nome: String(categoria.name),
    slug: String(categoria.slug),
  }));
}

export async function buscarProdutosParaAutocomplete({
  termoBusca,
  categoriaId,
}: ParametrosBuscaProdutos): Promise<ResultadoBuscaProdutos> {
  const termoNormalizado = termoBusca.trim().toLowerCase();

  if (!termoNormalizado) {
    return {
      produtosEncontrados: [],
      sugestoesEncontradas: [],
    };
  }

  const termoLike = `%${termoNormalizado}%`;
  const termoPrefixo = `${termoNormalizado}%`;
  const limitarTermoCurto = termoNormalizado.length === 1;

  const produtos = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.category_id,
      p.brand,
      c.name AS category_name,
      c.slug AS category_slug,
      imagem.image_url,
      preco.price,
      preco.promo_price_in_cents,
      CASE
        WHEN lower(p.name) LIKE ${termoPrefixo} THEN 1
        WHEN lower(p.name) LIKE ${termoLike} THEN 2
        WHEN lower(c.name) LIKE ${termoLike} THEN 3
        WHEN lower(coalesce(p.brand, '')) LIKE ${termoLike} THEN 4
        WHEN EXISTS (
          SELECT 1
          FROM unnest(coalesce(p.tags, ARRAY[]::text[])) AS tag
          WHERE lower(tag) LIKE ${termoLike}
        ) THEN 5
        ELSE 6
      END AS relevancia
    FROM product p
    LEFT JOIN category c ON c.id = p.category_id
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_gallery_images
      WHERE product_id = p.id
      ORDER BY is_primary DESC NULLS LAST, sort_order ASC NULLS LAST, created_at ASC
      LIMIT 1
    ) imagem ON true
    LEFT JOIN LATERAL (
      SELECT price_in_cents AS price, promo_price_in_cents
      FROM product_pricing
      WHERE product_id = p.id
        AND is_active = true
      ORDER BY main_card_price DESC NULLS LAST, created_at ASC
      LIMIT 1
    ) preco ON true
    WHERE p.is_active = true
      AND (${categoriaId ?? null}::uuid IS NULL OR p.category_id = ${categoriaId ?? null}::uuid)
      AND (
        lower(p.name) LIKE ${limitarTermoCurto ? termoPrefixo : termoLike}
        OR lower(coalesce(c.name, '')) LIKE ${limitarTermoCurto ? termoPrefixo : termoLike}
        OR (
          ${!limitarTermoCurto}
          AND lower(coalesce(p.brand, '')) LIKE ${termoLike}
        )
        OR (
          ${!limitarTermoCurto}
          AND EXISTS (
            SELECT 1
            FROM unnest(coalesce(p.tags, ARRAY[]::text[])) AS tag
            WHERE lower(tag) LIKE ${termoLike}
          )
        )
        OR (
          ${!limitarTermoCurto}
          AND lower(coalesce(p.card_short_text, '')) LIKE ${termoLike}
        )
      )
    ORDER BY relevancia ASC, p.name ASC
    LIMIT 5;
  `);

  const sugestoes = await db.execute(sql`
    WITH sugestoes AS (
      SELECT c.name AS termo, 1 AS prioridade
      FROM category c
      WHERE c.parent_id IS NULL
        AND c.level = 0
        AND c.is_active = true
        AND lower(c.name) LIKE ${termoLike}

      UNION ALL

      SELECT p.name AS termo, 2 AS prioridade
      FROM product p
      WHERE p.is_active = true
        AND lower(p.name) LIKE ${termoLike}

      UNION ALL

      SELECT DISTINCT p.brand AS termo, 3 AS prioridade
      FROM product p
      WHERE p.is_active = true
        AND p.brand IS NOT NULL
        AND lower(p.brand) LIKE ${termoLike}
    )
    SELECT termo
    FROM sugestoes
    WHERE termo IS NOT NULL
    ORDER BY prioridade ASC, termo ASC
    LIMIT 4;
  `);

  return {
    produtosEncontrados: produtos.rows.map((produto: any) => ({
      id: String(produto.id),
      nome: String(produto.name),
      slug: String(produto.slug),
      categoriaId: produto.category_id ? String(produto.category_id) : null,
      categoriaNome: produto.category_name
        ? String(produto.category_name)
        : null,
      categoriaSlug: produto.category_slug
        ? String(produto.category_slug)
        : null,
      precoEmCentavos:
        produto.promo_price_in_cents !== null || produto.price !== null
          ? Number(produto.promo_price_in_cents ?? produto.price)
          : null,
      imagemUrl: produto.image_url ? String(produto.image_url) : null,
    })),
    sugestoesEncontradas: sugestoes.rows
      .map((sugestao: any) => String(sugestao.termo))
      .filter(Boolean),
  };
}
