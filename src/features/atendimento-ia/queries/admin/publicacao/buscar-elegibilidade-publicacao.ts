import "server-only";

import { db } from "@/db/connection";
import { atendimentoIaAuditoriasTable } from "@/db/schema";

import { avaliarElegibilidadePublicacao } from "../../../lib/admin/publicacao/avaliar-elegibilidade-publicacao";
import { buscarElegibilidadePublicacaoSchema } from "../../../schemas/admin/elegibilidade-publicacao.schema";
import { buscarAcessoAtendimentoIa } from "../permissoes/buscar-acesso-atendimento-ia";
import { buscarEvidenciasElegibilidadeAdmin } from "./buscar-evidencias-elegibilidade";
export async function buscarElegibilidadePublicacaoAdmin(entrada: unknown) {
  const acesso = await buscarAcessoAtendimentoIa();
  if (!acesso?.capacidades.includes("conhecimentos_leitura"))
    throw new Error("ACESSO_NEGADO");
  const d = buscarElegibilidadePublicacaoSchema.parse(entrada);
  const evidencias = await buscarEvidenciasElegibilidadeAdmin(d);
  const resultado = avaliarElegibilidadePublicacao(evidencias);
  const bloqueiosAuditaveis = resultado.bloqueios.filter((item) =>
    /seguranca|privacidade|dados_pessoais|obsoleto|hash_aprovado|aprovador_sem_capacidade|autoaprovacao/.test(
      item,
    ),
  );
  if (bloqueiosAuditaveis.length)
    await db.insert(atendimentoIaAuditoriasTable).values({
      categoria: "seguranca",
      severidade: resultado.bloqueios.some((b) =>
        /seguranca|privacidade|dados_pessoais/.test(b),
      )
        ? "critico"
        : "atencao",
      resultado: "recusa",
      evento: "atendimento_ia_elegibilidade_bloqueada",
      tipoAtor: "usuario_admin",
      identificadorAtor: acesso.usuarioId,
      usuarioId: acesso.usuarioId,
      acao: "consultar_elegibilidade",
      autorizacao: "servidor",
      metadados: {
        tipo: d.tipo,
        candidatoId: d.candidatoId,
        bloqueios: bloqueiosAuditaveis,
      },
      versoes: { elegibilidade: "v1" },
    });
  return resultado;
}
