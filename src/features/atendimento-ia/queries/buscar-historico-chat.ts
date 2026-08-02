import "server-only";

import { asc, eq } from "drizzle-orm";

import {
  atendimentoIaConversasTable,
  atendimentoIaMensagensTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { conversaPertenceAIdentidade } from "../lib/seguranca-entrada-mensagem";
import type { IdentidadeEntradaAtendimento } from "../types/entrada-mensagem";

export async function buscarHistoricoChat(dados: {
  conversaId: string;
  identidade: IdentidadeEntradaAtendimento;
}) {
  const [conversa] = await dbTransacional
    .select({
      canal: atendimentoIaConversasTable.canal,
      id: atendimentoIaConversasTable.id,
      identificadorSessao: atendimentoIaConversasTable.identificadorSessao,
      usuarioId: atendimentoIaConversasTable.usuarioId,
    })
    .from(atendimentoIaConversasTable)
    .where(eq(atendimentoIaConversasTable.id, dados.conversaId))
    .limit(1);

  if (!conversa || !conversaPertenceAIdentidade(conversa, dados.identidade)) {
    return null;
  }

  const mensagens = await dbTransacional
    .select({
      autor: atendimentoIaMensagensTable.autor,
      conteudo: atendimentoIaMensagensTable.conteudo,
      id: atendimentoIaMensagensTable.id,
    })
    .from(atendimentoIaMensagensTable)
    .where(eq(atendimentoIaMensagensTable.conversaId, conversa.id))
    .orderBy(
      asc(atendimentoIaMensagensTable.criadoEm),
      asc(atendimentoIaMensagensTable.id),
    );

  return {
    conversaId: conversa.id,
    mensagens: mensagens.filter(
      (mensagem) =>
        mensagem.autor === "cliente" || mensagem.autor === "assistente_ia",
    ),
  };
}
