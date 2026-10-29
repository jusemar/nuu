import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { produtosVendaCruzadaTable } from "@/db/schema";

import { produtoIdVendaCruzadaSchema } from "../../schemas/venda-cruzada.schema";
import type { ConfiguracaoVendaCruzadaAdmin } from "../../types/venda-cruzada.types";
import {
  condicaoProdutoAdministrativo,
  exigirLeituraProdutoAdmin,
} from "../autorizacao/escopo-produtos-admin";
import { mapearProdutosVendaCruzadaAdmin } from "./mapear-produtos-venda-cruzada-admin";

export async function buscarConfiguracaoVendaCruzadaAdmin(
  produtoPrincipalIdEntrada: unknown,
): Promise<ConfiguracaoVendaCruzadaAdmin | null> {
  const produtoPrincipalId = produtoIdVendaCruzadaSchema.parse(
    produtoPrincipalIdEntrada,
  );
  const { contexto } = await exigirLeituraProdutoAdmin(produtoPrincipalId);
  const produto = await db.query.productTable.findFirst({
    where: (produto) =>
      and(
        eq(produto.id, produtoPrincipalId),
        condicaoProdutoAdministrativo(contexto, produto.id),
      ),
    with: {
      galleryImages: true,
      pricing: true,
      variants: true,
      vendasCruzadasConfiguradas: {
        where: (vinculo) =>
          condicaoProdutoAdministrativo(contexto, vinculo.produtoOferecidoId),
        orderBy: asc(produtosVendaCruzadaTable.ordem),
        with: {
          produtoOferecido: {
            with: { galleryImages: true, pricing: true, variants: true },
          },
        },
      },
    },
  });

  if (!produto) return null;

  const [produtoPrincipal] = await mapearProdutosVendaCruzadaAdmin([produto]);
  if (!produtoPrincipal) return null;

  return {
    ativa: produto.vendaCruzadaAtiva,
    produtoPrincipal,
    produtos: await mapearProdutosVendaCruzadaAdmin(
      produto.vendasCruzadasConfiguradas.map(
        (vinculo) => vinculo.produtoOferecido,
      ),
    ),
  };
}
