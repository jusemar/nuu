import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";

import { compararRestauracaoComPublicada } from "../../../lib/admin/restauracao/comparar-restauracao-com-publicada";
import { buscarVersaoHistoricaSchema } from "../../../schemas/admin/restauracao.schema";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { buscarVersaoHistoricaAdmin } from "./buscar-versao-historica";

export async function compararVersaoHistoricaPublicadaAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const dados = buscarVersaoHistoricaSchema.parse(entrada);
  const historica = await buscarVersaoHistoricaAdmin(dados);
  if (!historica) return null;
  if (dados.tipo === "conhecimento") {
    const [publicada] = await db
      .select({
        hash: atendimentoIaDocumentoVersoesTable.hashConteudo,
        numero: atendimentoIaDocumentoVersoesTable.versao,
      })
      .from(atendimentoIaDocumentoVersoesTable)
      .where(
        and(
          eq(atendimentoIaDocumentoVersoesTable.documentoId, dados.recursoId),
          eq(atendimentoIaDocumentoVersoesTable.estado, "publicado"),
        ),
      )
      .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao))
      .limit(1);
    return compararRestauracaoComPublicada({
      hashHistorico: historica.hash,
      hashPublicado: publicada?.hash ?? null,
      numeroHistorico: historica.numero,
      numeroPublicado: publicada?.numero ?? null,
    });
  }
  const [publicada] = await db
    .select({
      hash: atendimentoIaComportamentoVersoesTable.hash,
      numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
    })
    .from(atendimentoIaComportamentoVersoesTable)
    .where(
      and(
        eq(
          atendimentoIaComportamentoVersoesTable.comportamentoId,
          dados.recursoId,
        ),
        eq(atendimentoIaComportamentoVersoesTable.estado, "publicado"),
      ),
    )
    .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao))
    .limit(1);
  return compararRestauracaoComPublicada({
    hashHistorico: historica.hash,
    hashPublicado: publicada?.hash ?? null,
    numeroHistorico: historica.numero,
    numeroPublicado: publicada?.numero ?? null,
  });
}
