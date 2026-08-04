import { desc, eq } from "drizzle-orm";

import { atendimentoIaPapeisAdminTable } from "@/db/tables/atendimento-ia";
import { dbTransacional } from "@/db/transaction";

import { registrarAuditoriaPermissaoAtendimentoIa } from "./auditoria-permissoes";
import type { AtribuicaoPapelAtendimentoIa } from "./resolver-papel-atendimento-ia";

function projetarAtribuicao(
  registro: typeof atendimentoIaPapeisAdminTable.$inferSelect,
): AtribuicaoPapelAtendimentoIa {
  return {
    ativo: registro.ativo,
    capacidadesAdicionais: registro.capacidadesAdicionais,
    id: registro.id,
    origem:
      registro.origem === "bootstrap_admin_emails"
        ? "bootstrap_admin_emails"
        : "atribuicao_explicita",
    papel: registro.papel,
    usuarioId: registro.usuarioId,
  };
}

/** O insert usa a unicidade parcial do banco como trava contra acessos concorrentes. */
export async function bootstrapGestorPrincipalAtendimentoIa(
  usuarioId: string,
): Promise<AtribuicaoPapelAtendimentoIa | null> {
  return dbTransacional.transaction(async (transacao) => {
    const [historico] = await transacao
      .select()
      .from(atendimentoIaPapeisAdminTable)
      .where(eq(atendimentoIaPapeisAdminTable.usuarioId, usuarioId))
      .orderBy(desc(atendimentoIaPapeisAdminTable.criadoEm))
      .limit(1);

    // Uma revogação explícita nunca é anulada por um novo bootstrap.
    if (historico)
      return historico.ativo ? projetarAtribuicao(historico) : null;

    const [criado] = await transacao
      .insert(atendimentoIaPapeisAdminTable)
      .values({
        ativo: true,
        capacidadesAdicionais: [],
        origem: "bootstrap_admin_emails",
        papel: "gestor_principal",
        usuarioId,
      })
      .onConflictDoNothing()
      .returning();

    if (criado) {
      await registrarAuditoriaPermissaoAtendimentoIa(transacao, {
        acao: "bootstrap_gestor_principal",
        atorId: usuarioId,
        evento: "atendimento_ia_papel_bootstrap_criado",
        metadados: { origem: "ADMIN_EMAILS", papel: "gestor_principal" },
        resultado: "sucesso_comprovado",
        usuarioId,
      });
      return projetarAtribuicao(criado);
    }

    const [concorrente] = await transacao
      .select()
      .from(atendimentoIaPapeisAdminTable)
      .where(eq(atendimentoIaPapeisAdminTable.usuarioId, usuarioId))
      .orderBy(desc(atendimentoIaPapeisAdminTable.criadoEm))
      .limit(1);
    return concorrente?.ativo ? projetarAtribuicao(concorrente) : null;
  });
}

/** Núcleo testável que explicita a sequência idempotente usada na transação. */
export async function executarBootstrapGestorPrincipal(dependencias: {
  auditar: (registro: AtribuicaoPapelAtendimentoIa) => Promise<void>;
  buscarHistorico: () => Promise<AtribuicaoPapelAtendimentoIa | null>;
  tentarCriar: () => Promise<AtribuicaoPapelAtendimentoIa | null>;
}) {
  const historico = await dependencias.buscarHistorico();
  if (historico) return historico.ativo ? historico : null;
  const criado = await dependencias.tentarCriar();
  if (criado) {
    await dependencias.auditar(criado);
    return criado;
  }
  const concorrente = await dependencias.buscarHistorico();
  return concorrente?.ativo ? concorrente : null;
}

export { projetarAtribuicao };
