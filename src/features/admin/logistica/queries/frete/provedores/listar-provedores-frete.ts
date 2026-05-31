import "server-only";

import { db } from "@/db/connection";
import { provedoresFreteTable } from "@/db/schema";
import {
  erroConexaoLogisticaIndisponivel,
  erroTabelaLogisticaAusente,
} from "@/features/admin/logistica/lib/erro-tabela-logistica-ausente";
import { asc } from "drizzle-orm";

export async function listarProvedoresFrete() {
  try {
    return await db
      .select({
        id: provedoresFreteTable.id,
        identificador: provedoresFreteTable.identificador,
        nome: provedoresFreteTable.nome,
        ativo: provedoresFreteTable.ativo,
        createdAt: provedoresFreteTable.createdAt,
        updatedAt: provedoresFreteTable.updatedAt,
      })
      .from(provedoresFreteTable)
      .orderBy(asc(provedoresFreteTable.nome));
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
