import "server-only";

import { ilike, or } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";

import { buscarProdutosVendaCruzadaSchema } from "../../schemas/venda-cruzada.schema";
import { mapearProdutosVendaCruzadaAdmin } from "./mapear-produtos-venda-cruzada-admin";

export async function buscarProdutosVendaCruzadaAdmin(entrada: unknown) {
  const dados = buscarProdutosVendaCruzadaSchema.parse(entrada);
  const filtro = dados.busca
    ? or(
        ilike(productTable.name, `%${dados.busca}%`),
        ilike(productTable.sku, `%${dados.busca}%`),
      )
    : undefined;
  const produtos = await db.query.productTable.findMany({
    where: filtro,
    orderBy: (produto, { asc }) => [asc(produto.name)],
    limit: dados.limite,
    with: { galleryImages: true, pricing: true, variants: true },
  });

  return mapearProdutosVendaCruzadaAdmin(produtos);
}
