import "server-only";

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  atendimentoIaComportamentoVersoesTable,
  atendimentoIaPublicacaoItensTable,
  atendimentoIaPublicacoesTable,
} from "@/db/schema";

import { montarInstrucoesPublicadas } from "./montar-instrucoes-publicadas";
import { validarFallbackComportamento } from "./validar-fallback-comportamento";

export type ComportamentoEfetivo = {
  instrucoes: string;
  versaoId: string | null;
  identidadePublicacao: string | null;
  fallback: boolean;
  hashConfiguracao: string;
};

export async function resolverVersaoPublicadaComportamento(): Promise<ComportamentoEfetivo> {
  const fallback = validarFallbackComportamento();
  const hashFallback = (await import("node:crypto"))
    .createHash("sha256")
    .update(fallback)
    .digest("hex");
  if (process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS !== "true")
    return {
      instrucoes: fallback,
      versaoId: null,
      identidadePublicacao: null,
      fallback: true,
      hashConfiguracao: hashFallback,
    };
  try {
    const [registro] = await db
      .select({
        configuracao:
          atendimentoIaComportamentoVersoesTable.configuracaoEstruturada,
        identidade: atendimentoIaPublicacoesTable.identidade,
        versaoId: atendimentoIaComportamentoVersoesTable.id,
      })
      .from(atendimentoIaComportamentoVersoesTable)
      .innerJoin(
        atendimentoIaPublicacaoItensTable,
        eq(
          atendimentoIaPublicacaoItensTable.candidatoId,
          atendimentoIaComportamentoVersoesTable.id,
        ),
      )
      .innerJoin(
        atendimentoIaPublicacoesTable,
        eq(
          atendimentoIaPublicacoesTable.id,
          atendimentoIaPublicacaoItensTable.publicacaoId,
        ),
      )
      .where(
        and(
          eq(atendimentoIaComportamentoVersoesTable.estado, "publicado"),
          eq(atendimentoIaPublicacoesTable.status, "concluida"),
          isNotNull(atendimentoIaPublicacoesTable.publicadoEm),
        ),
      )
      .orderBy(desc(atendimentoIaPublicacoesTable.publicadoEm))
      .limit(1);
    if (!registro) throw new Error("SEM_COMPORTAMENTO_PUBLICADO");
    const composta = montarInstrucoesPublicadas(registro.configuracao);
    return {
      instrucoes: composta.instrucoes,
      versaoId: registro.versaoId,
      identidadePublicacao: registro.identidade,
      fallback: false,
      hashConfiguracao: composta.hashConfiguracao,
    };
  } catch {
    return {
      instrucoes: fallback,
      versaoId: null,
      identidadePublicacao: null,
      fallback: true,
      hashConfiguracao: hashFallback,
    };
  }
}
