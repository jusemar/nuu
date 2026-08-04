import { randomUUID } from "node:crypto";

import { and, count, eq, inArray, ne } from "drizzle-orm";
import type { z } from "zod";

import {
  atendimentoIaCasosTesteTable,
  atendimentoIaCasoTesteVersoesTable,
  atendimentoIaPapeisAdminTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { calcularHashCasoTeste } from "../../lib/admin/testes/calcular-hash-caso-teste";
import { normalizarCasoTeste } from "../../lib/admin/testes/normalizar-caso-teste";
import { validarPoliticaEditorialCasoTeste } from "../../lib/admin/testes/politica-editorial-caso-teste";
import type { conteudoVersaoCasoTesteSchema } from "../../schemas/admin/caso-teste.schema";

export type ConteudoCaso = z.infer<typeof conteudoVersaoCasoTesteSchema>;
export function prepararConteudoCaso(conteudo: ConteudoCaso) {
  const normalizado = normalizarCasoTeste(conteudo);
  validarPoliticaEditorialCasoTeste(normalizado);
  return { normalizado, hash: calcularHashCasoTeste(normalizado) };
}
export function mapearVersaoCasoTeste(
  conteudo: ReturnType<typeof prepararConteudoCaso>["normalizado"],
  hash: string,
  atorId: string,
) {
  return {
    entradaControlada: conteudo.entradaControlada,
    contextoSimulado: conteudo.contextoSimulado,
    expectativas: conteudo.expectativas,
    ferramentasPermitidas: conteudo.ferramentasPermitidas,
    ferramentasProibidas: conteudo.ferramentasProibidas,
    efeitosEsperados: "nenhum" as const,
    criterios: conteudo.criterios,
    dadosOrigem: conteudo.dadosOrigem,
    justificativaSnapshot: conteudo.justificativaSnapshot,
    autorizadoSnapshotPorId:
      conteudo.dadosOrigem === "snapshot_anonimizado" ? atorId : null,
    hash,
    criadoPorId: atorId,
  };
}
export function chaveCaso() {
  return `caso-teste-${randomUUID()}`;
}
export function chaveConjunto() {
  return `conjunto-teste-${randomUUID()}`;
}
export async function buscarOutrosDecisores(
  tx: Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0],
  usuarioId: string,
) {
  const [resultado] = await tx
    .select({ total: count() })
    .from(atendimentoIaPapeisAdminTable)
    .where(
      and(
        eq(atendimentoIaPapeisAdminTable.ativo, true),
        inArray(atendimentoIaPapeisAdminTable.papel, [
          "gestor_principal",
          "revisor",
        ]),
        ne(atendimentoIaPapeisAdminTable.usuarioId, usuarioId),
      ),
    );
  return resultado?.total ?? 0;
}
export { atendimentoIaCasosTesteTable, atendimentoIaCasoTesteVersoesTable };
