import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "@/db/schema";
import { atendimentoIaAuditoriasTable } from "@/db/tables/atendimento-ia";

type BancoAuditoria = NodePgDatabase<typeof schema>;

export async function registrarAuditoriaPermissaoAtendimentoIa(
  banco: BancoAuditoria,
  dados: {
    acao: string;
    atorId: string | null;
    evento: string;
    metadados?: Record<string, unknown>;
    resultado: "sucesso_comprovado" | "recusa" | "falha";
    usuarioId?: string | null;
  },
) {
  await banco.insert(atendimentoIaAuditoriasTable).values({
    acao: dados.acao,
    autorizacao: dados.resultado === "recusa" ? "negada" : "servidor",
    categoria: "seguranca",
    evento: dados.evento,
    identificadorAtor: dados.atorId,
    metadados: dados.metadados,
    resultado: dados.resultado,
    severidade: dados.resultado === "recusa" ? "atencao" : "informativo",
    tipoAtor: dados.atorId ? "usuario_admin" : "sistema",
    usuarioId: dados.usuarioId ?? dados.atorId,
    versoes: { autorizacaoAtendimentoIa: "v1" },
  });
}
