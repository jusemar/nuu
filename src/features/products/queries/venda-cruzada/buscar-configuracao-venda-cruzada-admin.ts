import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable, produtosVendaCruzadaTable } from "@/db/schema";

import { produtoIdVendaCruzadaSchema } from "../../schemas/venda-cruzada.schema";
import type { ConfiguracaoVendaCruzadaAdmin } from "../../types/venda-cruzada.types";
import { mapearProdutosVendaCruzadaAdmin } from "./mapear-produtos-venda-cruzada-admin";

export async function buscarConfiguracaoVendaCruzadaAdmin(
  produtoPrincipalIdEntrada: unknown,
): Promise<ConfiguracaoVendaCruzadaAdmin | null> {
  const produtoPrincipalId = produtoIdVendaCruzadaSchema.parse(
    produtoPrincipalIdEntrada,
  );
  const produto = await db.query.productTable.findFirst({
    where: eq(productTable.id, produtoPrincipalId),
    with: {
      galleryImages: true,
      pricing: true,
      variants: true,
      vendasCruzadasConfiguradas: {
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
