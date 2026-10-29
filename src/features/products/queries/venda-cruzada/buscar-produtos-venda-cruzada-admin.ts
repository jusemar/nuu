import "server-only";

import { and, ilike, or } from "drizzle-orm";

import { db } from "@/db/connection";

import { buscarProdutosVendaCruzadaSchema } from "../../schemas/venda-cruzada.schema";
import {
  condicaoProdutoAdministrativo,
  exigirLeituraProdutoAdmin,
} from "../autorizacao/escopo-produtos-admin";
import { mapearProdutosVendaCruzadaAdmin } from "./mapear-produtos-venda-cruzada-admin";

export async function buscarProdutosVendaCruzadaAdmin(entrada: unknown) {
  const dados = buscarProdutosVendaCruzadaSchema.parse(entrada);
  const { contexto } = await exigirLeituraProdutoAdmin(
    dados.produtoPrincipalId,
  );
  const produtos = await db.query.productTable.findMany({
    where: (produto) =>
      and(
        condicaoProdutoAdministrativo(contexto, produto.id),
        dados.busca
          ? or(
              ilike(produto.name, `%${dados.busca}%`),
              ilike(produto.sku, `%${dados.busca}%`),
            )
          : undefined,
      ),
    orderBy: (produto, { asc }) => [asc(produto.name)],
    limit: dados.limite,
    with: { galleryImages: true, pricing: true, variants: true },
  });

  return mapearProdutosVendaCruzadaAdmin(produtos);
}
