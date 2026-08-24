import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  productTable,
  produtosTiposLogisticosTable,
  tiposLogisticosTable,
} from "@/db/schema";
import { erroTabelaVinculoAusente } from "@/features/admin/logistica/lib/erro-tabela-vinculo-ausente";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarProdutosVinculadosTiposLogisticos() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  try {
    return await db
      .select({
        id: produtosTiposLogisticosTable.id,
        produtoId: produtosTiposLogisticosTable.produtoId,
        produtoNome: productTable.name,
        tipoLogisticoId: produtosTiposLogisticosTable.tipoLogisticoId,
        tipoLogisticoNome: tiposLogisticosTable.nome,
        createdAt: produtosTiposLogisticosTable.createdAt,
      })
      .from(produtosTiposLogisticosTable)
      .innerJoin(
        productTable,
        eq(produtosTiposLogisticosTable.produtoId, productTable.id),
      )
      .innerJoin(
        tiposLogisticosTable,
        eq(
          produtosTiposLogisticosTable.tipoLogisticoId,
          tiposLogisticosTable.id,
        ),
      )
      .orderBy(asc(productTable.name), asc(tiposLogisticosTable.nome));
  } catch (erro) {
    if (erroTabelaVinculoAusente(erro)) {
      return [];
    }

    throw erro;
  }
}
