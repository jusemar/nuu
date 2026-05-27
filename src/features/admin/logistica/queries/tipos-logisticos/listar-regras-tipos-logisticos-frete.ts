import "server-only";

import { db } from "@/db/connection";
import {
  provedoresFreteTable,
  regrasTiposLogisticosFreteTable,
  servicosFreteTable,
  tiposLogisticosTable,
  transportadorasFreteTable,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function listarRegrasTiposLogisticosFrete() {
  return db
    .select({
      id: regrasTiposLogisticosFreteTable.id,
      tipoLogisticoId: regrasTiposLogisticosFreteTable.tipoLogisticoId,
      tipoLogisticoNome: tiposLogisticosTable.nome,
      efeito: regrasTiposLogisticosFreteTable.efeito,
      ativo: regrasTiposLogisticosFreteTable.ativo,
      provedorFreteId: regrasTiposLogisticosFreteTable.provedorFreteId,
      provedorNome: provedoresFreteTable.nome,
      transportadoraFreteId: regrasTiposLogisticosFreteTable.transportadoraFreteId,
      transportadoraNome: transportadorasFreteTable.nome,
      servicoFreteId: regrasTiposLogisticosFreteTable.servicoFreteId,
      servicoNome: servicosFreteTable.nome,
      createdAt: regrasTiposLogisticosFreteTable.createdAt,
      updatedAt: regrasTiposLogisticosFreteTable.updatedAt,
    })
    .from(regrasTiposLogisticosFreteTable)
    .innerJoin(
      tiposLogisticosTable,
      eq(regrasTiposLogisticosFreteTable.tipoLogisticoId, tiposLogisticosTable.id),
    )
    .leftJoin(
      provedoresFreteTable,
      eq(regrasTiposLogisticosFreteTable.provedorFreteId, provedoresFreteTable.id),
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
    .orderBy(asc(tiposLogisticosTable.nome), asc(regrasTiposLogisticosFreteTable.createdAt));
}

