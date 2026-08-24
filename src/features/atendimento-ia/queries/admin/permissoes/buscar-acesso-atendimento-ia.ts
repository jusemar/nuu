import "server-only";

import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db/connection";
import {
  atendimentoIaAuditoriasTable,
  atendimentoIaPapeisAdminTable,
} from "@/db/tables/atendimento-ia";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

import {
  projetarAtribuicaoPapelAtendimentoIa,
  resolverPapelAtendimentoIa,
} from "../../../lib/admin/permissoes/resolver-papel-atendimento-ia";
import { verificarCapacidadeAtendimentoIa } from "../../../lib/admin/permissoes/verificar-capacidade";
import type { CapacidadeAtendimentoIaAdmin } from "../../../types/admin/permissoes";

export async function buscarAcessoAtendimentoIa() {
  try {
    await exigirPermissaoAdmin(PERMISSOES_ADMIN.ATENDENTE_IA.ACESSAR);
  } catch {
    return null;
  }
  const sessaoAdmin = await buscarSessaoAdmin();
  const usuario = sessaoAdmin.sessao?.user;

  if (!sessaoAdmin.autorizado || !usuario) {
    if (usuario) {
      await db
        .insert(atendimentoIaAuditoriasTable)
        .values({
          acao: "acessar_modulo",
          autorizacao: "negada",
          categoria: "seguranca",
          evento: "atendimento_ia_acesso_negado_admin_emails",
          identificadorAtor: usuario.id,
          resultado: "recusa",
          severidade: "atencao",
          tipoAtor: "usuario_admin",
          usuarioId: usuario.id,
          versoes: { autorizacaoAtendimentoIa: "v1" },
        })
        .catch(() => undefined);
    }
    return null;
  }

  const [ultimoRegistro] = await db
    .select()
    .from(atendimentoIaPapeisAdminTable)
    .where(eq(atendimentoIaPapeisAdminTable.usuarioId, usuario.id))
    .orderBy(desc(atendimentoIaPapeisAdminTable.criadoEm))
    .limit(1);
  if (ultimoRegistro && !ultimoRegistro.ativo) {
    await db
      .insert(atendimentoIaAuditoriasTable)
      .values({
        acao: "acessar_modulo",
        autorizacao: "negada",
        categoria: "seguranca",
        evento: "atendimento_ia_acesso_negado_papel_revogado",
        identificadorAtor: usuario.id,
        resultado: "recusa",
        severidade: "atencao",
        tipoAtor: "usuario_admin",
        usuarioId: usuario.id,
        versoes: { autorizacaoAtendimentoIa: "v1" },
      })
      .catch(() => undefined);
    return null;
  }
  if (!ultimoRegistro) return null;
  const atribuicao = projetarAtribuicaoPapelAtendimentoIa(ultimoRegistro);
  return resolverPapelAtendimentoIa({
    acessoGlobalAutorizado: true,
    atribuicao,
  });
}

export async function exigirCapacidadeAtendimentoIa(
  capacidade: CapacidadeAtendimentoIaAdmin,
) {
  const acesso = await buscarAcessoAtendimentoIa();
  if (!verificarCapacidadeAtendimentoIa(acesso, capacidade)) {
    if (acesso) {
      await db
        .insert(atendimentoIaAuditoriasTable)
        .values({
          acao: capacidade,
          autorizacao: "negada",
          categoria: "seguranca",
          evento: "atendimento_ia_capacidade_negada",
          identificadorAtor: acesso.usuarioId,
          metadados: { capacidade },
          resultado: "recusa",
          severidade: "atencao",
          tipoAtor: "usuario_admin",
          usuarioId: acesso.usuarioId,
          versoes: { autorizacaoAtendimentoIa: "v1" },
        })
        .catch(() => undefined);
    }
    redirect("/admin");
  }
  // Mantém o contrato não anulável explícito mesmo para analisadores que não
  // propagam o tipo `never` do redirect do Next.js.
  if (!acesso) throw new Error("ACESSO_NEGADO");
  return acesso;
}
