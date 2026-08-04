import {
  atendimentoIaAuditoriasTable,
  atendimentoIaPublicacaoItensTable,
  atendimentoIaPublicacoesTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

type Transacao = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

export async function registrarPublicacao(
  transacao: Transacao,
  dados: {
    atorId: string;
    chaveIdempotencia: string;
    hashRequisicao: string;
    identidade: string;
    justificativaAlertas?: string;
    itens: Array<{
      candidatoId: string;
      hash: string;
      ordem: number;
      tipo: string;
      versaoAnteriorId?: string | null;
    }>;
    tipo: string;
  },
) {
  const agora = new Date();
  const [publicacao] = await transacao
    .insert(atendimentoIaPublicacoesTable)
    .values({
      chaveIdempotencia: dados.chaveIdempotencia,
      hashRequisicao: dados.hashRequisicao,
      identidade: dados.identidade,
      justificativaAlertas: dados.justificativaAlertas,
      publicadoEm: agora,
      publicadoPorId: dados.atorId,
      status: "concluida",
      tipo: dados.tipo,
      atualizadoEm: agora,
      metadados: { quantidadeItens: dados.itens.length },
    })
    .returning();
  if (!publicacao) throw new Error("REGISTRO_PUBLICACAO_FALHOU");
  await transacao.insert(atendimentoIaPublicacaoItensTable).values(
    dados.itens.map((item) => ({
      ...item,
      publicacaoId: publicacao.id,
    })),
  );
  await transacao.insert(atendimentoIaAuditoriasTable).values({
    acao: "publicar_conteudo_atendente_ia",
    autorizacao: "servidor",
    categoria: "operacao",
    evento: "atendimento_ia_publicacao_concluida",
    identificadorAtor: dados.atorId,
    metadados: {
      identidade: dados.identidade,
      publicacaoId: publicacao.id,
      tipo: dados.tipo,
      quantidadeItens: dados.itens.length,
    },
    resultado: "sucesso_comprovado",
    severidade: "informativo",
    tipoAtor: "usuario_admin",
    usuarioId: dados.atorId,
    versoes: { publicacao: "v1" },
  });
  return publicacao;
}
