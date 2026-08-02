import "server-only";

import { and, eq } from "drizzle-orm";

import {
  atendimentoIaConversasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaMensagensTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { conversaPertenceAIdentidade } from "../lib/seguranca-entrada-mensagem";
import type { IdentidadeEntradaAtendimento } from "../types/entrada-mensagem";

export async function buscarResultadoChat(dados: {
  identidade: IdentidadeEntradaAtendimento;
  mensagemClienteId: string;
  mensagemRespostaId?: string | null;
}) {
  const [vinculo] = await dbTransacional
    .select({
      conversa: {
        canal: atendimentoIaConversasTable.canal,
        id: atendimentoIaConversasTable.id,
        identificadorSessao: atendimentoIaConversasTable.identificadorSessao,
        usuarioId: atendimentoIaConversasTable.usuarioId,
      },
      execucaoId: atendimentoIaExecucoesTable.id,
    })
    .from(atendimentoIaMensagensTable)
    .innerJoin(
      atendimentoIaConversasTable,
      eq(
        atendimentoIaConversasTable.id,
        atendimentoIaMensagensTable.conversaId,
      ),
    )
    .leftJoin(
      atendimentoIaExecucoesTable,
      eq(
        atendimentoIaExecucoesTable.mensagemId,
        atendimentoIaMensagensTable.id,
      ),
    )
    .where(eq(atendimentoIaMensagensTable.id, dados.mensagemClienteId))
    .limit(1);

  if (
    !vinculo ||
    !conversaPertenceAIdentidade(vinculo.conversa, dados.identidade)
  ) {
    return null;
  }

  const chaveResposta = vinculo.execucaoId
    ? `resposta_modelo:${vinculo.execucaoId}`
    : null;
  const chaveOferta = vinculo.execucaoId
    ? `oferta_transferencia:${vinculo.execucaoId}`
    : null;

  if (dados.mensagemRespostaId) {
    const [mensagem] = await dbTransacional
      .select({
        autor: atendimentoIaMensagensTable.autor,
        conteudo: atendimentoIaMensagensTable.conteudo,
        id: atendimentoIaMensagensTable.id,
      })
      .from(atendimentoIaMensagensTable)
      .where(
        and(
          eq(atendimentoIaMensagensTable.conversaId, vinculo.conversa.id),
          eq(atendimentoIaMensagensTable.id, dados.mensagemRespostaId),
        ),
      )
      .limit(1);

    if (mensagem?.autor === "assistente_ia") {
      return { conversaId: vinculo.conversa.id, mensagem };
    }
  }

  if (!chaveResposta || !chaveOferta) return null;
  const [mensagemPorExecucao] = await dbTransacional
    .select({
      autor: atendimentoIaMensagensTable.autor,
      conteudo: atendimentoIaMensagensTable.conteudo,
      id: atendimentoIaMensagensTable.id,
    })
    .from(atendimentoIaMensagensTable)
    .where(
      and(
        eq(atendimentoIaMensagensTable.conversaId, vinculo.conversa.id),
        // A resposta normal e a oferta possuem prefixos diferentes, mas ambas
        // são localizadas abaixo sem aceitar uma chave vinda do cliente.
        eq(atendimentoIaMensagensTable.chaveIdempotencia, chaveResposta),
      ),
    )
    .limit(1);
  if (mensagemPorExecucao?.autor === "assistente_ia") {
    return { conversaId: vinculo.conversa.id, mensagem: mensagemPorExecucao };
  }
  const [oferta] = await dbTransacional
    .select({
      autor: atendimentoIaMensagensTable.autor,
      conteudo: atendimentoIaMensagensTable.conteudo,
      id: atendimentoIaMensagensTable.id,
    })
    .from(atendimentoIaMensagensTable)
    .where(
      and(
        eq(atendimentoIaMensagensTable.conversaId, vinculo.conversa.id),
        eq(atendimentoIaMensagensTable.chaveIdempotencia, chaveOferta),
      ),
    )
    .limit(1);
  return oferta?.autor === "assistente_ia"
    ? { conversaId: vinculo.conversa.id, mensagem: oferta }
    : null;
}
