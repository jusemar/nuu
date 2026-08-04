import "server-only";

import { and, count, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaDocumentoVersoesTable,
} from "@/db/schema";

import { listarRestauracoesSchema } from "../../../schemas/admin/restauracao.schema";
import { exigirCapacidadeAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";

export async function listarRestauracoesAdmin(entrada: unknown) {
  await exigirCapacidadeAtendimentoIa("conhecimentos_leitura");
  const dados = listarRestauracoesSchema.parse(entrada);
  const offset = (dados.pagina - 1) * dados.limite;
  if (dados.tipo === "conhecimento") {
    const filtro = and(
      eq(atendimentoIaDocumentoVersoesTable.documentoId, dados.recursoId),
      isNotNull(atendimentoIaDocumentoVersoesTable.restauradaDeVersaoId),
    );
    const [[total], itens] = await Promise.all([
      db
        .select({ total: count() })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(filtro),
      db
        .select({
          criadoEm: atendimentoIaDocumentoVersoesTable.criadoEm,
          estado: atendimentoIaDocumentoVersoesTable.estado,
          id: atendimentoIaDocumentoVersoesTable.id,
          justificativa: atendimentoIaDocumentoVersoesTable.motivoAlteracao,
          numero: atendimentoIaDocumentoVersoesTable.versao,
          versaoOrigemId:
            atendimentoIaDocumentoVersoesTable.restauradaDeVersaoId,
        })
        .from(atendimentoIaDocumentoVersoesTable)
        .where(filtro)
        .orderBy(desc(atendimentoIaDocumentoVersoesTable.versao))
        .limit(dados.limite)
        .offset(offset),
    ]);
    return { itens, total: total?.total ?? 0 };
  }
  const [itens, [total]] = await Promise.all([
    db
      .select({
        criadoEm: atendimentoIaComportamentoVersoesTable.criadoEm,
        estado: atendimentoIaComportamentoVersoesTable.estado,
        id: atendimentoIaComportamentoVersoesTable.id,
        justificativa: atendimentoIaComportamentoVersoesTable.motivoAlteracao,
        numero: atendimentoIaComportamentoVersoesTable.numeroVersao,
        versaoOrigemId:
          atendimentoIaComportamentoVersoesTable.restauradaDeVersaoId,
      })
      .from(atendimentoIaComportamentoVersoesTable)
      .where(
        and(
          eq(
            atendimentoIaComportamentoVersoesTable.comportamentoId,
            dados.recursoId,
          ),
          isNotNull(
            atendimentoIaComportamentoVersoesTable.restauradaDeVersaoId,
          ),
        ),
      )
      .orderBy(desc(atendimentoIaComportamentoVersoesTable.numeroVersao))
      .limit(dados.limite)
      .offset(offset),
    db
      .select({ total: count() })
      .from(atendimentoIaComportamentoVersoesTable)
      .where(
        and(
          eq(
            atendimentoIaComportamentoVersoesTable.comportamentoId,
            dados.recursoId,
          ),
          isNotNull(
            atendimentoIaComportamentoVersoesTable.restauradaDeVersaoId,
          ),
        ),
      ),
  ]);
  return { itens, total: total?.total ?? 0 };
}
