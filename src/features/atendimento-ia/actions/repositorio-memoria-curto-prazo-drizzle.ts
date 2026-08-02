import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import {
  atendimentoIaAuditoriasTable,
  atendimentoIaAutorizacoesMemoriaTable,
  atendimentoIaConversasTable,
  atendimentoIaMemoriasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  CATEGORIAS_MEMORIA_AUTORIZADAS,
  VERSAO_TEXTO_AUTORIZACAO_MEMORIA,
} from "../constants/contexto";
import {
  type CategoriaMemoria,
  compararMemoria,
  normalizarAssuntoMemoria,
} from "../lib/memoria-curto-prazo";

function contemConteudoProibido(valor: Record<string, unknown>) {
  const texto = JSON.stringify(valor);
  return /(senha|password|token|chave|cart[aã]o|cvv|documento|cpf|cnpj|banc[aá]ri|custo|margem|fornecedor|chain.?of.?thought|racioc[ií]nio)/iu.test(
    texto,
  );
}

export class RepositorioMemoriaCurtoPrazoDrizzle {
  async autorizar(dados: {
    origem: string;
    usuarioId: string;
    versaoTexto: string;
  }) {
    if (
      dados.versaoTexto !== VERSAO_TEXTO_AUTORIZACAO_MEMORIA ||
      !dados.origem.trim()
    ) {
      throw new Error("AUTORIZACAO_INVALIDA");
    }
    return dbTransacional.transaction(async (transacao) => {
      await transacao
        .update(atendimentoIaAutorizacoesMemoriaTable)
        .set({ atualizadoEm: new Date(), revogadaEm: new Date(), situacao: "revogada" })
        .where(
          and(
            eq(atendimentoIaAutorizacoesMemoriaTable.usuarioId, dados.usuarioId),
            eq(atendimentoIaAutorizacoesMemoriaTable.situacao, "ativa"),
          ),
        );
      const [registro] = await transacao
        .insert(atendimentoIaAutorizacoesMemoriaTable)
        .values({
          autorizadaEm: new Date(),
          evento: "autorizacao_explicita_memoria_30_dias",
          origem: dados.origem,
          situacao: "ativa",
          usuarioId: dados.usuarioId,
          versaoTexto: dados.versaoTexto,
        })
        .returning({ id: atendimentoIaAutorizacoesMemoriaTable.id });
      if (!registro) throw new Error("AUTORIZACAO_NAO_PERSISTIDA");
      await transacao.insert(atendimentoIaAuditoriasTable).values({
        evento: "memoria_autorizada",
        metadados: {
          origem: dados.origem,
          status: "concluida",
          versao: dados.versaoTexto,
        },
        tipoAtor: "cliente_autenticado",
      });
      return registro;
    });
  }

  async revogar(usuarioId: string) {
    await dbTransacional.transaction(async (transacao) => {
      await transacao
        .update(atendimentoIaAutorizacoesMemoriaTable)
        .set({ atualizadoEm: new Date(), revogadaEm: new Date(), situacao: "revogada" })
        .where(
          and(
            eq(atendimentoIaAutorizacoesMemoriaTable.usuarioId, usuarioId),
            eq(atendimentoIaAutorizacoesMemoriaTable.situacao, "ativa"),
          ),
        );
      await transacao.insert(atendimentoIaAuditoriasTable).values({
        evento: "memoria_autorizacao_revogada",
        metadados: { status: "concluida" },
        tipoAtor: "cliente_autenticado",
      });
    });
  }

  async persistirConfirmada(dados: {
    assunto: string;
    categoria: CategoriaMemoria;
    conversaId: string;
    correcaoExplicita: boolean;
    diasExpiracao: number;
    origem: "informada_cliente" | "confirmada_sistema";
    usuarioId: string;
    valorEstruturado: Record<string, unknown>;
  }) {
    if (
      !CATEGORIAS_MEMORIA_AUTORIZADAS.includes(dados.categoria) ||
      contemConteudoProibido(dados.valorEstruturado)
    ) {
      throw new Error("MEMORIA_NAO_PERMITIDA");
    }
    const assuntoNormalizado = normalizarAssuntoMemoria(dados.assunto);
    if (!assuntoNormalizado) throw new Error("ASSUNTO_INVALIDO");
    return dbTransacional.transaction(async (transacao) => {
      const [conversa] = await transacao
        .select({ usuarioId: atendimentoIaConversasTable.usuarioId })
        .from(atendimentoIaConversasTable)
        .where(eq(atendimentoIaConversasTable.id, dados.conversaId))
        .limit(1);
      if (!conversa?.usuarioId || conversa.usuarioId !== dados.usuarioId) {
        throw new Error("IDENTIDADE_INCOMPATIVEL");
      }
      const [autorizacao] = await transacao
        .select({ id: atendimentoIaAutorizacoesMemoriaTable.id })
        .from(atendimentoIaAutorizacoesMemoriaTable)
        .where(
          and(
            eq(atendimentoIaAutorizacoesMemoriaTable.usuarioId, dados.usuarioId),
            eq(atendimentoIaAutorizacoesMemoriaTable.situacao, "ativa"),
          ),
        )
        .orderBy(desc(atendimentoIaAutorizacoesMemoriaTable.autorizadaEm))
        .limit(1);
      if (!autorizacao) throw new Error("AUTORIZACAO_AUSENTE");
      const [existente] = await transacao
        .select()
        .from(atendimentoIaMemoriasTable)
        .where(
          and(
            eq(atendimentoIaMemoriasTable.usuarioId, dados.usuarioId),
            eq(atendimentoIaMemoriasTable.categoria, dados.categoria),
            eq(atendimentoIaMemoriasTable.assuntoNormalizado, assuntoNormalizado),
            eq(atendimentoIaMemoriasTable.situacao, "ativa"),
            isNull(atendimentoIaMemoriasTable.removidaEm),
          ),
        )
        .limit(1);
      const agora = new Date();
      const expiraEm = new Date(agora.getTime() + dados.diasExpiracao * 86_400_000);
      if (existente) {
        const comparacao = compararMemoria(
          {
            assuntoNormalizado: existente.assuntoNormalizado,
            autorizacaoAtiva: true,
            categoria: existente.categoria as CategoriaMemoria,
            expiraEm: existente.expiraEm ?? agora,
            necessidadeEncerrada: existente.necessidadeEncerrada,
            origem: existente.origem as "informada_cliente" | "confirmada_sistema",
            proprietarioId: existente.usuarioId,
            removidaEm: existente.removidaEm,
            restrita: existente.restrita,
            sensibilidade: existente.sensibilidade as "comercial" | "restrita",
            situacao: existente.situacao as "ativa",
            ultimaUtilizacaoValidaEm: existente.ultimaUtilizacaoValidaEm,
            valorEstruturado: existente.valorEstruturado,
          },
          { assuntoNormalizado, categoria: dados.categoria, correcaoExplicita: dados.correcaoExplicita, valorEstruturado: dados.valorEstruturado },
        );
        if (comparacao === "duplicada") {
          await transacao
            .update(atendimentoIaMemoriasTable)
            .set({ atualizadoEm: agora, expiraEm, ultimaUtilizacaoValidaEm: agora })
            .where(eq(atendimentoIaMemoriasTable.id, existente.id));
          await this.auditarMemoria(transacao, dados.conversaId, "duplicada");
          return { id: existente.id, resultado: "duplicada" as const };
        }
        if (comparacao === "complementar") {
          await transacao
            .update(atendimentoIaMemoriasTable)
            .set({
              atualizadoEm: agora,
              expiraEm,
              ultimaUtilizacaoValidaEm: agora,
              valorEstruturado: {
                ...existente.valorEstruturado,
                ...dados.valorEstruturado,
              },
            })
            .where(eq(atendimentoIaMemoriasTable.id, existente.id));
          await this.auditarMemoria(transacao, dados.conversaId, "complementada");
          return { id: existente.id, resultado: "complementada" as const };
        }
        if (comparacao === "contradicao") {
          await transacao
            .update(atendimentoIaMemoriasTable)
            .set({ atualizadoEm: agora, situacao: "contraditoria" })
            .where(eq(atendimentoIaMemoriasTable.id, existente.id));
          await this.auditarMemoria(transacao, dados.conversaId, "contradicao");
          return { id: existente.id, resultado: "contradicao" as const };
        }
        await transacao
          .update(atendimentoIaMemoriasTable)
          .set({ atualizadoEm: agora, situacao: "substituida" })
          .where(eq(atendimentoIaMemoriasTable.id, existente.id));
      }
      const [nova] = await transacao
        .insert(atendimentoIaMemoriasTable)
        .values({
          assuntoNormalizado,
          autorizacaoId: autorizacao.id,
          autorizadaEm: agora,
          categoria: dados.categoria,
          conversaOrigemId: dados.conversaId,
          expiraEm,
          origem: dados.origem,
          ultimaUtilizacaoValidaEm: agora,
          usuarioId: dados.usuarioId,
          valorEstruturado: dados.valorEstruturado,
        })
        .returning({ id: atendimentoIaMemoriasTable.id });
      if (!nova) throw new Error("MEMORIA_NAO_PERSISTIDA");
      if (existente) {
        await transacao
          .update(atendimentoIaMemoriasTable)
          .set({ substituidaPorId: nova.id })
          .where(eq(atendimentoIaMemoriasTable.id, existente.id));
      }
      await this.auditarMemoria(
        transacao,
        dados.conversaId,
        existente ? "substituida" : "criada",
      );
      return { id: nova.id, resultado: existente ? "substituida" as const : "criada" as const };
    });
  }

  async remover(dados: { memoriaId: string; usuarioId: string }) {
    await dbTransacional.transaction(async (transacao) => {
      await transacao
        .update(atendimentoIaMemoriasTable)
        .set({ atualizadoEm: new Date(), removidaEm: new Date(), situacao: "substituida" })
        .where(
          and(
            eq(atendimentoIaMemoriasTable.id, dados.memoriaId),
            eq(atendimentoIaMemoriasTable.usuarioId, dados.usuarioId),
          ),
        );
      await transacao.insert(atendimentoIaAuditoriasTable).values({
        evento: "memoria_removida",
        metadados: { status: "concluida" },
        tipoAtor: "cliente_autenticado",
      });
    });
  }

  private async auditarMemoria(
    transacao: Parameters<Parameters<typeof dbTransacional.transaction>[0]>[0],
    conversaId: string,
    status: string,
  ) {
    await transacao.insert(atendimentoIaAuditoriasTable).values({
      conversaId,
      evento: "memoria_curto_prazo_mantida",
      metadados: { status },
      tipoAtor: "sistema",
    });
  }
}
