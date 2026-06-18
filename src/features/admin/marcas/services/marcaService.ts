"use server";

import { db } from "@/db/connection";
import { marcaTable, productTable } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";

function slugify(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listarMarcas() {
  const marcas = await db
    .select({
      id: marcaTable.id,
      nome: marcaTable.nome,
      slug: marcaTable.slug,
      descricao: marcaTable.descricao,
      logoUrl: marcaTable.logoUrl,
      ativo: marcaTable.ativo,
      createdAt: marcaTable.createdAt,
      updatedAt: marcaTable.updatedAt,
      totalProdutos: sql<number>`(
        select count(*)::int from product p where p.marca_id = ${marcaTable.id}
      )`,
    })
    .from(marcaTable)
    .orderBy(asc(marcaTable.nome));

  return marcas.map((item) => ({
    ...item,
    totalProdutos: Number(item.totalProdutos || 0),
    isPadrao: item.slug === "generico",
  }));
}

export async function listarMarcasAtivas() {
  return db
    .select({
      id: marcaTable.id,
      nome: marcaTable.nome,
      slug: marcaTable.slug,
    })
    .from(marcaTable)
    .where(eq(marcaTable.ativo, true))
    .orderBy(asc(marcaTable.nome));
}

export async function buscarMarcaGenerica() {
  const [marcaGenerica] = await db
    .select({ id: marcaTable.id, nome: marcaTable.nome, slug: marcaTable.slug })
    .from(marcaTable)
    .where(eq(marcaTable.slug, "generico"))
    .limit(1);

  return marcaGenerica ?? null;
}

export async function criarMarca(entrada: {
  nome: string;
  descricao?: string;
  logoUrl?: string;
}) {
  const nome = entrada.nome.trim();
  if (!nome) throw new Error("Nome da marca é obrigatório");

  const slug = slugify(nome);
  if (!slug) throw new Error("Nome inválido para gerar slug");

  const [existeSlug] = await db
    .select({ id: marcaTable.id })
    .from(marcaTable)
    .where(eq(marcaTable.slug, slug))
    .limit(1);

  if (existeSlug) throw new Error("Já existe marca com este nome");

  const [marcaCriada] = await db.insert(marcaTable).values({
    nome,
    slug,
    descricao: entrada.descricao?.trim() || null,
    logoUrl: entrada.logoUrl?.trim() || null,
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning({
    id: marcaTable.id,
    nome: marcaTable.nome,
    slug: marcaTable.slug,
  });

  return {
    success: true,
    marca: marcaCriada ?? null,
  };
}

export async function editarMarca(
  id: string,
  entrada: { nome: string; descricao?: string; logoUrl?: string },
) {
  const nome = entrada.nome.trim();
  if (!nome) throw new Error("Nome da marca é obrigatório");

  const slug = slugify(nome);
  if (!slug) throw new Error("Nome inválido para gerar slug");

  const [conflito] = await db
    .select({ id: marcaTable.id })
    .from(marcaTable)
    .where(and(eq(marcaTable.slug, slug), sql`${marcaTable.id} <> ${id}`))
    .limit(1);

  if (conflito) throw new Error("Já existe marca com este nome");

  await db
    .update(marcaTable)
    .set({
      nome,
      slug,
      descricao: entrada.descricao?.trim() || null,
      logoUrl: entrada.logoUrl?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(marcaTable.id, id));

  await db
    .update(productTable)
    .set({
      brand: nome,
      updatedAt: new Date(),
    })
    .where(eq(productTable.marcaId, id));

  return { success: true };
}

export async function alternarAtivoMarca(id: string, ativo: boolean) {
  const [marca] = await db
    .select({ slug: marcaTable.slug })
    .from(marcaTable)
    .where(eq(marcaTable.id, id))
    .limit(1);

  if (!marca) throw new Error("Marca não encontrada");
  if (marca.slug === "generico" && !ativo) {
    throw new Error("Não é permitido desativar a marca padrão Genérico");
  }

  await db
    .update(marcaTable)
    .set({ ativo, updatedAt: new Date() })
    .where(eq(marcaTable.id, id));

  return { success: true };
}

export async function excluirMarca(id: string) {
  const [marca] = await db
    .select({ slug: marcaTable.slug, nome: marcaTable.nome })
    .from(marcaTable)
    .where(eq(marcaTable.id, id))
    .limit(1);

  if (!marca) throw new Error("Marca não encontrada");
  if (marca.slug === "generico") {
    throw new Error("Não é permitido excluir a marca padrão Genérico");
  }

  const [vinculo] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productTable)
    .where(eq(productTable.marcaId, id));

  if (Number(vinculo?.total || 0) > 0) {
    throw new Error(
      `Não é possível excluir. Existem ${vinculo?.total} produto(s) vinculados.`,
    );
  }

  await db.delete(marcaTable).where(eq(marcaTable.id, id));
  return { success: true };
}
