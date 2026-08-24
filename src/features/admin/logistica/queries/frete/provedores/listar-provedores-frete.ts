import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/db/connection";
import { provedoresFreteTable } from "@/db/schema";
import {
  erroConexaoLogisticaIndisponivel,
  erroTabelaLogisticaAusente,
} from "@/features/admin/logistica/lib/erro-tabela-logistica-ausente";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarProvedoresFrete() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
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
