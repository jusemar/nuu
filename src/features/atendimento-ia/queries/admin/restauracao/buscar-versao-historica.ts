import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";

import { buscarVersaoHistoricaSchema } from "../../../schemas/admin/restauracao.schema";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function buscarVersaoHistoricaAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const dados = buscarVersaoHistoricaSchema.parse(entrada);
  if (dados.tipo === "conhecimento") {
    const [item] = await db
      .select({
        conteudoEstruturado:
          atendimentoIaDocumentoVersoesTable.conteudoEstruturado,
        criadoEm: atendimentoIaDocumentoVersoesTable.criadoEm,
        estado: atendimentoIaDocumentoVersoesTable.estado,
        hash: atendimentoIaDocumentoVersoesTable.hashConteudo,
        id: atendimentoIaDocumentoVersoesTable.id,
        numero: atendimentoIaDocumentoVersoesTable.versao,
        restauradaDeVersaoId:
          atendimentoIaDocumentoVersoesTable.restauradaDeVersaoId,
      })
      .from(atendimentoIaDocumentoVersoesTable)
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.id, dados.versaoId),
          eq(atendimentoIaDocumentoVersoesTable.documentoId, dados.recursoId),
        ),
      )
      .limit(1);
    return item ? { ...item, tipo: dados.tipo } : null;
  }
  const [item] = await db
    .select({
      configuracao:
        atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
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
      and(
        eq(atendimentoIaComportamentoVersoesTable.id, dados.versaoId),
        eq(
          atendimentoIaComportamentoVersoesTable.comportamentoId,
          dados.recursoId,
        ),
      ),
    )
    .limit(1);
  return item ? { ...item, tipo: dados.tipo } : null;
}
