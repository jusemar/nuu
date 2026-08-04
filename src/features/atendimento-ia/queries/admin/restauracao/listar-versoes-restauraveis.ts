import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";

import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarVersoesRestauraveisAdmin(entrada: {
  recursoId: string;
  tipo: "conhecimento" | "comportamento";
}) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  if (entrada.tipo === "conhecimento") {
    return db
      .select({
        criadoEm: atendimentoIaDocumentoVersoesTable.criadoEm,
        estado: atendimentoIaDocumentoVersoesTable.estado,
        hash: atendimentoIaDocumentoVersoesTable.hashConteudo,
        id: atendimentoIaDocumentoVersoesTable.id,
        numero: atendimentoIaDocumentoVersoesTable.versao,
        restauradaDeVersaoId:
          atendimentoIaDocumentoVersoesTable.restauradaDeVersaoId,
      })
      .from(atendimentoIaDocumentoVersoesTable)
      .where(eq(atendimentoIaDocumentoVersoesTable.documentoId, entrada.recursoId))
      .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao));
  }
  return db
    .select({
      criadoEm: atendimentoIaComportamentoVersoesTable.criadoEm,
      estado: atendimentoIaComportamentoVersoesTable.estado,
      hash: atendimentoIaComportamentoVersoesTable.hash,
      id: atendimentoIaComportamentoVersoesTable.id,
      numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
      restauradaDeVersaoId:
        atendimentoIaComportamentoVersoesTable.restauradaDeVersaoId,
    })
    .from(atendimentoIaComportamentoVersoesTable)
    .where(
      eq(
        atendimentoIaComportamentoVersoesTable.comportamentoId,
        entrada.recursoId,
      ),
    )
    .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao));
}
