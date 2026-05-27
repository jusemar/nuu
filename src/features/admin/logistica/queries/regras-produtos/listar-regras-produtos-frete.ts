import "server-only";

import { db } from "@/db/connection";
import {
  productTable,
  provedoresFreteTable,
  regrasProdutosFreteTable,
  servicosFreteTable,
  transportadorasFreteTable,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function listarRegrasProdutosFrete() {
  return db
    .select({
      id: regrasProdutosFreteTable.id,
      produtoId: regrasProdutosFreteTable.produtoId,
      produtoNome: productTable.name,
      efeito: regrasProdutosFreteTable.efeito,
      ativo: regrasProdutosFreteTable.ativo,
      provedorFreteId: regrasProdutosFreteTable.provedorFreteId,
      provedorNome: provedoresFreteTable.nome,
      transportadoraFreteId: regrasProdutosFreteTable.transportadoraFreteId,
      transportadoraNome: transportadorasFreteTable.nome,
      servicoFreteId: regrasProdutosFreteTable.servicoFreteId,
      servicoNome: servicosFreteTable.nome,
      createdAt: regrasProdutosFreteTable.createdAt,
      updatedAt: regrasProdutosFreteTable.updatedAt,
    })
    .from(regrasProdutosFreteTable)
    .innerJoin(productTable, eq(regrasProdutosFreteTable.produtoId, productTable.id))
    .leftJoin(provedoresFreteTable, eq(regrasProdutosFreteTable.provedorFreteId, provedoresFreteTable.id))
    .leftJoin(
      transportadorasFreteTable,
      eq(regrasProdutosFreteTable.transportadoraFreteId, transportadorasFreteTable.id),
    )
    .leftJoin(servicosFreteTable, eq(regrasProdutosFreteTable.servicoFreteId, servicosFreteTable.id))
    .orderBy(asc(productTable.name), asc(regrasProdutosFreteTable.createdAt));
}

