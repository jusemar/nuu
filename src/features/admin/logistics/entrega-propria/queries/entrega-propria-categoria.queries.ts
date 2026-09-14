"use server";

import { asc, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import { categoryOwnDeliveryPrices, categoryTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import {
  exigirPermissaoAdmin,
  obterContextoAdministrativo,
} from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { montarCadeiaCategorias } from "@/features/logistica/lib/disponibilidade/resolver-modo-herdado";

import { mapearPrecoEntregaPropriaAdmin } from "../lib/mapear-preco-entrega-propria-admin";
import type { EntregaPropriaPrecoProduto } from "./admin-entrega-propria.queries";

/** Leitura usada no Produto e na Categoria: basta ver produtos OU categorias. */
async function exigirLeituraProdutoOuCategoria() {
  const contexto = await obterContextoAdministrativo();
  if (
    !podeAdmin(contexto, PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR) &&
    !podeAdmin(contexto, PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR)
  ) {
    await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR);
  }
}

export type CategoriaEntregaPropriaAdmin = {
  categoriaId: string;
  categoriaNome: string;
  modo: "herdar" | "ativado" | "desativado";
  /** "categoria" = direta; "categoria-ancestral" = superior. */
  nivel: "categoria" | "categoria-ancestral";
  precos: EntregaPropriaPrecoProduto[];
};

/**
 * Cadeia de categorias (da informada até a raiz) com o modo de Entrega
 * Própria e as condições comerciais de cada uma. É a base da herança exibida
 * no Admin, calculada com as mesmas regras puras do motor público.
 */
export async function buscarCadeiaEntregaPropriaCategoriaAdmin(
  categoriaId: string | null,
): Promise<CategoriaEntregaPropriaAdmin[]> {
  await exigirLeituraProdutoOuCategoria();
  const id = z.string().uuid().nullable().safeParse(categoriaId);
  if (!id.success || !id.data) return [];

  const categorias = await db
    .select({
      id: categoryTable.id,
      nome: categoryTable.name,
      parentId: categoryTable.parentId,
      modo: categoryTable.disponibilidadeEntregaPropria,
    })
    .from(categoryTable);
  const cadeia = montarCadeiaCategorias(categorias, id.data);
  if (cadeia.length === 0) return [];

  const precos = await db.query.categoryOwnDeliveryPrices.findMany({
    where: inArray(
      categoryOwnDeliveryPrices.categoryId,
      cadeia.map((categoria) => categoria.id),
    ),
    orderBy: [
      asc(categoryOwnDeliveryPrices.destinationType),
      asc(categoryOwnDeliveryPrices.id),
    ],
    with: {
      region: true,
      bairro: { with: { cidade: true } },
      cepEspecifico: true,
      cidade: true,
    },
  });

  return cadeia.map((categoria, indice) => ({
    categoriaId: categoria.id,
    categoriaNome: categoria.nome,
    modo: categoria.modo,
    nivel: indice === 0 ? "categoria" : "categoria-ancestral",
    precos: precos
      .filter((preco) => preco.categoryId === categoria.id)
      .map(mapearPrecoEntregaPropriaAdmin),
  }));
}
