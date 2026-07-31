import "server-only";

import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaConversasTable,
  atendimentoIaEstadosTable,
  atendimentoIaIdempotenciasTable,
  atendimentoIaMensagensTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import type {
  EstadoMensagemAtendimento,
  IdentidadeEntradaAtendimento,
  RepositorioEntradaAtendimento,
} from "../types/entrada-mensagem";

type ClienteTransacional = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];
type ClienteBanco = typeof dbTransacional | ClienteTransacional;

export class RepositorioEntradaAtendimentoDrizzle
  implements RepositorioEntradaAtendimento
{
  constructor(private readonly banco: ClienteBanco = dbTransacional) {}

  async executarAtomico<T>(
    operacao: (repositorio: RepositorioEntradaAtendimento) => Promise<T>,
  ): Promise<T> {
    if (this.banco !== dbTransacional) return operacao(this);

    return dbTransacional.transaction((transacao) =>
      operacao(new RepositorioEntradaAtendimentoDrizzle(transacao)),
    );
  }

  async buscarConversa(id: string) {
    const [conversa] = await this.banco
      .select({
        canal: atendimentoIaConversasTable.canal,
        id: atendimentoIaConversasTable.id,
        identificadorSessao: atendimentoIaConversasTable.identificadorSessao,
        status: atendimentoIaConversasTable.status,
        usuarioId: atendimentoIaConversasTable.usuarioId,
      })
      .from(atendimentoIaConversasTable)
      .where(eq(atendimentoIaConversasTable.id, id))
      .limit(1);

    return conversa ?? null;
  }

  async criarConversa(identidade: IdentidadeEntradaAtendimento, canal: "site") {
    const [conversa] = await this.banco
      .insert(atendimentoIaConversasTable)
      .values({
        canal,
        identificadorSessao: identidade.identificadorSessao,
        usuarioId: identidade.usuarioId,
      })
      .returning({
        canal: atendimentoIaConversasTable.canal,
        id: atendimentoIaConversasTable.id,
        identificadorSessao: atendimentoIaConversasTable.identificadorSessao,
        status: atendimentoIaConversasTable.status,
        usuarioId: atendimentoIaConversasTable.usuarioId,
      });

    if (!conversa) throw new Error("CONVERSA_NAO_CRIADA");
    return conversa;
  }

  async criarEstadoInicial(conversaId: string) {
    await this.banco
      .insert(atendimentoIaEstadosTable)
      .values({ conversaId, estadoEstruturado: {}, versao: 1 });
  }

  async buscarMensagemPorIdempotencia(escopo: string, chave: string) {
    const [idempotencia] = await this.banco
      .select({
        hashRequisicao: atendimentoIaIdempotenciasTable.hashRequisicao,
        referenciaResultado:
          atendimentoIaIdempotenciasTable.referenciaResultado,
      })
      .from(atendimentoIaIdempotenciasTable)
      .where(
        and(
          eq(atendimentoIaIdempotenciasTable.escopo, escopo),
          eq(atendimentoIaIdempotenciasTable.chave, chave),
        ),
      )
      .limit(1);

    if (!idempotencia?.referenciaResultado) return null;

    const [mensagem] = await this.banco
      .select({
        conversaId: atendimentoIaMensagensTable.conversaId,
        id: atendimentoIaMensagensTable.id,
        status: atendimentoIaMensagensTable.status,
      })
      .from(atendimentoIaMensagensTable)
      .where(
        eq(atendimentoIaMensagensTable.id, idempotencia.referenciaResultado),
      )
      .limit(1);

    if (!mensagem) return null;
    return { hashRequisicao: idempotencia.hashRequisicao, mensagem };
  }

  async criarMensagemRecebida(dados: {
    chaveIdempotencia: string;
    conteudo: string;
    conversaId: string;
    identificadorCanal: string;
  }) {
    const [mensagem] = await this.banco
      .insert(atendimentoIaMensagensTable)
      .values({
        autor: "cliente",
        chaveIdempotencia: dados.chaveIdempotencia,
        conteudo: dados.conteudo,
        conversaId: dados.conversaId,
        identificadorCanal: dados.identificadorCanal,
        status: "recebida",
      })
      .returning({
        conversaId: atendimentoIaMensagensTable.conversaId,
        id: atendimentoIaMensagensTable.id,
        status: atendimentoIaMensagensTable.status,
      });

    if (!mensagem) throw new Error("MENSAGEM_NAO_CRIADA");
    return mensagem;
  }

  async criarIdempotencia(dados: {
    chave: string;
    conversaId: string;
    escopo: string;
    expiraEm: Date;
    hashRequisicao: string;
    mensagemId: string;
  }) {
    await this.banco.insert(atendimentoIaIdempotenciasTable).values({
      chave: dados.chave,
      conversaId: dados.conversaId,
      escopo: dados.escopo,
      expiraEm: dados.expiraEm,
      hashRequisicao: dados.hashRequisicao,
      referenciaResultado: dados.mensagemId,
      status: "processando",
    });
  }

  async concluirIdempotencia(
    escopo: string,
    chave: string,
    mensagemId: string,
  ) {
    await this.banco
      .update(atendimentoIaIdempotenciasTable)
      .set({
        atualizadoEm: new Date(),
        referenciaResultado: mensagemId,
        status: "concluida",
      })
      .where(
        and(
          eq(atendimentoIaIdempotenciasTable.escopo, escopo),
          eq(atendimentoIaIdempotenciasTable.chave, chave),
        ),
      );
  }

  async atualizarEstadoMensagem(
    mensagemId: string,
    estado: EstadoMensagemAtendimento,
  ) {
    await this.banco
      .update(atendimentoIaMensagensTable)
      .set({ atualizadoEm: new Date(), status: estado })
      .where(eq(atendimentoIaMensagensTable.id, mensagemId));
  }

  async atualizarAtividadeConversa(conversaId: string) {
    const agora = new Date();
    await this.banco
      .update(atendimentoIaConversasTable)
      .set({ atualizadoEm: agora, ultimaAtividadeEm: agora })
      .where(eq(atendimentoIaConversasTable.id, conversaId));
  }

  async registrarAuditoriaEntrada(dados: {
    conversaId: string;
    mensagemId: string;
    tipoAtor: "cliente_autenticado" | "visitante";
    identificadorAtor: string;
  }) {
    const identificadorSanitizado = createHash("sha256")
      .update(dados.identificadorAtor)
      .digest("hex");

    await this.banco.insert(atendimentoIaAuditoriasTable).values({
      conversaId: dados.conversaId,
      evento: "mensagem_recebida",
      identificadorAtor: identificadorSanitizado,
      mensagemId: dados.mensagemId,
      metadados: { canal: "site" },
      tipoAtor: dados.tipoAtor,
    });
  }
}
