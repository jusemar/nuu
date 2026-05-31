import "server-only";

import { db } from "@/db/connection";
import {
  provedoresFreteTable,
  servicosFreteTable,
  transportadorasFreteTable,
} from "@/db/schema";
import {
  erroConexaoLogisticaIndisponivel,
  erroTabelaLogisticaAusente,
} from "@/features/admin/logistica/lib/erro-tabela-logistica-ausente";
import { asc, eq } from "drizzle-orm";

export async function listarServicosFrete() {
  try {
    return await db
      .select({
        id: servicosFreteTable.id,
        identificador: servicosFreteTable.identificador,
        nome: servicosFreteTable.nome,
        ativo: servicosFreteTable.ativo,
        provedorFreteId: servicosFreteTable.provedorFreteId,
        provedorNome: provedoresFreteTable.nome,
        provedorIdentificador: provedoresFreteTable.identificador,
        transportadoraFreteId: servicosFreteTable.transportadoraFreteId,
        transportadoraNome: transportadorasFreteTable.nome,
        transportadoraIdentificador: transportadorasFreteTable.identificador,
        pesoMaximoEmGramas: servicosFreteTable.pesoMaximoEmGramas,
        alturaMaximaEmCm: servicosFreteTable.alturaMaximaEmCm,
        larguraMaximaEmCm: servicosFreteTable.larguraMaximaEmCm,
        comprimentoMaximoEmCm: servicosFreteTable.comprimentoMaximoEmCm,
        createdAt: servicosFreteTable.createdAt,
        updatedAt: servicosFreteTable.updatedAt,
      })
      .from(servicosFreteTable)
      .innerJoin(
        provedoresFreteTable,
        eq(servicosFreteTable.provedorFreteId, provedoresFreteTable.id),
      )
      .leftJoin(
        transportadorasFreteTable,
        eq(
          servicosFreteTable.transportadoraFreteId,
          transportadorasFreteTable.id,
        ),
      )
      .orderBy(asc(provedoresFreteTable.nome), asc(servicosFreteTable.nome));
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
