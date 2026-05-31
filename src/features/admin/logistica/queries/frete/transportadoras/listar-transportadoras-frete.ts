import "server-only";

import { db } from "@/db/connection";
import { provedoresFreteTable, transportadorasFreteTable } from "@/db/schema";
import {
  erroConexaoLogisticaIndisponivel,
  erroTabelaLogisticaAusente,
} from "@/features/admin/logistica/lib/erro-tabela-logistica-ausente";
import { asc, eq } from "drizzle-orm";

export async function listarTransportadorasFrete() {
  try {
    return await db
      .select({
        id: transportadorasFreteTable.id,
        identificador: transportadorasFreteTable.identificador,
        nome: transportadorasFreteTable.nome,
        ativo: transportadorasFreteTable.ativo,
        provedorFreteId: transportadorasFreteTable.provedorFreteId,
        provedorNome: provedoresFreteTable.nome,
        provedorIdentificador: provedoresFreteTable.identificador,
        pesoMaximoEmGramas: transportadorasFreteTable.pesoMaximoEmGramas,
        alturaMaximaEmCm: transportadorasFreteTable.alturaMaximaEmCm,
        larguraMaximaEmCm: transportadorasFreteTable.larguraMaximaEmCm,
        comprimentoMaximoEmCm: transportadorasFreteTable.comprimentoMaximoEmCm,
        createdAt: transportadorasFreteTable.createdAt,
        updatedAt: transportadorasFreteTable.updatedAt,
      })
      .from(transportadorasFreteTable)
      .innerJoin(
        provedoresFreteTable,
        eq(transportadorasFreteTable.provedorFreteId, provedoresFreteTable.id),
      )
      .orderBy(
        asc(provedoresFreteTable.nome),
        asc(transportadorasFreteTable.nome),
      );
  } catch (erro) {
    if (
      erroTabelaLogisticaAusente(erro) ||
      erroConexaoLogisticaIndisponivel(erro)
    ) {
      return [];
    }
    throw erro;
  }
}
