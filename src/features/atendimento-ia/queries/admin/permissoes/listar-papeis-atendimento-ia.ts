import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { atendimentoIaPapeisAdminTable, userTable } from "@/db/schema";

import { paginacaoAdminSchema } from "../../../schemas/admin/filtros.schema";
import { exigirCapacidadeAtendimentoIa } from "./buscar-acesso-atendimento-ia";

export async function listarPapeisAtendimentoIa(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("papeis_gestao");
  const paginacao = paginacaoAdminSchema.parse(entrada);
  return db
    .select({
      ativo: atendimentoIaPapeisAdminTable.ativo,
      capacidadesAdicionais:
        atendimentoIaPapeisAdminTable.capacidadesAdicionais,
      email: userTable.email,
      id: atendimentoIaPapeisAdminTable.id,
      nome: userTable.name,
      origem: atendimentoIaPapeisAdminTable.origem,
      papel: atendimentoIaPapeisAdminTable.papel,
      usuarioId: atendimentoIaPapeisAdminTable.usuarioId,
    })
    .from(atendimentoIaPapeisAdminTable)
    .innerJoin(
      userTable,
      eq(userTable.id, atendimentoIaPapeisAdminTable.usuarioId),
    )
    .orderBy(desc(atendimentoIaPapeisAdminTable.criadoEm))
    .limit(paginacao.limite)
    .offset((paginacao.pagina - 1) * paginacao.limite);
}
