import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  provedoresFreteTable,
  regrasTiposLogisticosFreteTable,
  servicosFreteTable,
  tiposLogisticosTable,
  transportadorasFreteTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarRegrasTiposLogisticosFrete() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db
    .select({
      id: regrasTiposLogisticosFreteTable.id,
      tipoLogisticoId: regrasTiposLogisticosFreteTable.tipoLogisticoId,
      tipoLogisticoNome: tiposLogisticosTable.nome,
      efeito: regrasTiposLogisticosFreteTable.efeito,
      ativo: regrasTiposLogisticosFreteTable.ativo,
      provedorFreteId: regrasTiposLogisticosFreteTable.provedorFreteId,
      provedorNome: provedoresFreteTable.nome,
      transportadoraFreteId:
        regrasTiposLogisticosFreteTable.transportadoraFreteId,
      transportadoraNome: transportadorasFreteTable.nome,
      servicoFreteId: regrasTiposLogisticosFreteTable.servicoFreteId,
      servicoNome: servicosFreteTable.nome,
      createdAt: regrasTiposLogisticosFreteTable.createdAt,
      updatedAt: regrasTiposLogisticosFreteTable.updatedAt,
    })
    .from(regrasTiposLogisticosFreteTable)
    .innerJoin(
      tiposLogisticosTable,
      eq(
        regrasTiposLogisticosFreteTable.tipoLogisticoId,
        tiposLogisticosTable.id,
      ),
    )
    .leftJoin(
      provedoresFreteTable,
      eq(
        regrasTiposLogisticosFreteTable.provedorFreteId,
        provedoresFreteTable.id,
      ),
    )
    .leftJoin(
      transportadorasFreteTable,
      eq(
        regrasTiposLogisticosFreteTable.transportadoraFreteId,
        transportadorasFreteTable.id,
      ),
    )
    .leftJoin(
      servicosFreteTable,
      eq(regrasTiposLogisticosFreteTable.servicoFreteId, servicosFreteTable.id),
    )
    .orderBy(
      asc(tiposLogisticosTable.nome),
      asc(regrasTiposLogisticosFreteTable.createdAt),
    );
}
