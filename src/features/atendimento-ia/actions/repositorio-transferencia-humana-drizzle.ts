import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import {
  atendimentoIaConversasTable,
  atendimentoIaExecucoesTable,
  atendimentoIaTransferenciasTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { conversaPertenceAIdentidade } from "../lib/seguranca-entrada-mensagem";
import { criarCorrelacaoSegura } from "../lib/seguranca-observabilidade";
import type { IdentidadeEntradaAtendimento } from "../types/entrada-mensagem";
import type {
  RepositorioTransferenciaHumana,
  TransferenciaWhatsapp,
} from "../types/transferencia-humana";
import { RepositorioSegurancaObservabilidadeDrizzle } from "./repositorio-seguranca-observabilidade-drizzle";

const campos = {
  confirmadoEm: atendimentoIaTransferenciasTable.confirmadoEm,
  conversaId: atendimentoIaTransferenciasTable.conversaId,
  execucaoId: atendimentoIaTransferenciasTable.execucaoSolicitacaoId,
  expiraEm: atendimentoIaTransferenciasTable.expiraEm,
  hashResumo: atendimentoIaTransferenciasTable.hashResumo,
  id: atendimentoIaTransferenciasTable.id,
  motivo: atendimentoIaTransferenciasTable.motivo,
  ofertaConfirmadaEm: atendimentoIaTransferenciasTable.ofertaConfirmadaEm,
  referenciaConfirmacaoId: atendimentoIaTransferenciasTable.referenciaConfirmacaoId,
  referenciaDestinatarioHash: atendimentoIaTransferenciasTable.referenciaDestinatarioHash,
  referenciaSessaoHash: atendimentoIaTransferenciasTable.referenciaSessaoHash,
  resumo: atendimentoIaTransferenciasTable.resumoEstruturado,
  status: atendimentoIaTransferenciasTable.status,
  usuarioId: atendimentoIaTransferenciasTable.usuarioId,
};

function mapear(registro: typeof campos extends never ? never : Record<string, unknown>): TransferenciaWhatsapp {
  const resumo = registro.resumo;
  return {
    ...registro,
    resumo:
      resumo &&
      typeof resumo === "object" &&
      !Array.isArray(resumo) &&
      Object.keys(resumo).length === 0
        ? null
        : resumo,
  } as unknown as TransferenciaWhatsapp;
}

const estadosAtuais = [
  "oferecido", "recusado", "resumo_preparado", "aguardando_confirmacao",
  "confirmado", "cancelado", "link_gerado", "whatsapp_aberto",
  "falha_ao_gerar_link", "expirado",
] as const;

export class RepositorioTransferenciaHumanaDrizzle
  implements RepositorioTransferenciaHumana
{
  async buscar(id: string, identidade: IdentidadeEntradaAtendimento) {
    const [registro] = await dbTransacional.select({
      ...campos,
      conversa: {
        canal: atendimentoIaConversasTable.canal,
        id: atendimentoIaConversasTable.id,
        identificadorSessao: atendimentoIaConversasTable.identificadorSessao,
        usuarioId: atendimentoIaConversasTable.usuarioId,
      },
    }).from(atendimentoIaTransferenciasTable)
      .innerJoin(atendimentoIaConversasTable, eq(atendimentoIaConversasTable.id, atendimentoIaTransferenciasTable.conversaId))
      .where(and(eq(atendimentoIaTransferenciasTable.id, id), inArray(atendimentoIaTransferenciasTable.status, [...estadosAtuais]))).limit(1);
    if (!registro || !conversaPertenceAIdentidade(registro.conversa, identidade)) return null;
    const transferencia = { ...registro };
    delete (transferencia as Partial<typeof registro>).conversa;
    return mapear(transferencia);
  }

  async criarOferta(dados: Parameters<RepositorioTransferenciaHumana["criarOferta"]>[0]) {
    return dbTransacional.transaction(async (tx) => {
      const [vinculo] = await tx.select({
        conversa: {
          canal: atendimentoIaConversasTable.canal,
          id: atendimentoIaConversasTable.id,
          identificadorSessao: atendimentoIaConversasTable.identificadorSessao,
          usuarioId: atendimentoIaConversasTable.usuarioId,
        },
      }).from(atendimentoIaConversasTable)
        .innerJoin(atendimentoIaExecucoesTable, and(
          eq(atendimentoIaExecucoesTable.id, dados.execucaoId),
          eq(atendimentoIaExecucoesTable.conversaId, atendimentoIaConversasTable.id),
        ))
        .where(eq(atendimentoIaConversasTable.id, dados.conversaId)).limit(1);
      if (!vinculo || !conversaPertenceAIdentidade(vinculo.conversa, dados.identidade)) throw new Error("CONVERSA_TRANSFERENCIA_INDISPONIVEL");
      const [criada] = await tx.insert(atendimentoIaTransferenciasTable).values({
        canal: "whatsapp",
        chaveIdempotencia: dados.chaveIdempotencia,
        conversaId: dados.conversaId,
        execucaoSolicitacaoId: dados.execucaoId,
        mensagemSolicitacaoId: dados.mensagemId,
        motivo: dados.motivo,
        referenciaSessaoHash: dados.referenciaSessaoHash,
        resumo: "",
        status: "oferecido",
        usuarioId: dados.identidade.usuarioId,
      }).onConflictDoNothing().returning(campos);
      if (criada) return mapear(criada);
      const [existente] = await tx.select(campos).from(atendimentoIaTransferenciasTable)
        .where(eq(atendimentoIaTransferenciasTable.chaveIdempotencia, dados.chaveIdempotencia)).limit(1);
      if (!existente || existente.conversaId !== dados.conversaId) throw new Error("IDEMPOTENCIA_TRANSFERENCIA_CONFLITANTE");
      return mapear(existente);
    });
  }

  async registrarAceiteOferta(dados: Parameters<RepositorioTransferenciaHumana["registrarAceiteOferta"]>[0]) {
    const [registro] = await dbTransacional.update(atendimentoIaTransferenciasTable)
      .set({ atualizadoEm: dados.instante, ofertaConfirmadaEm: dados.instante })
      .where(and(eq(atendimentoIaTransferenciasTable.id, dados.id), eq(atendimentoIaTransferenciasTable.status, "oferecido")))
      .returning({ id: atendimentoIaTransferenciasTable.id });
    return Boolean(registro);
  }

  async prepararResumo(dados: Parameters<RepositorioTransferenciaHumana["prepararResumo"]>[0]) {
    const [registro] = await dbTransacional.update(atendimentoIaTransferenciasTable).set({
      atualizadoEm: new Date(), expiraEm: dados.expiraEm, hashResumo: dados.hashResumo,
      confirmadoEm: null,
      linkGeradoEm: null,
      referenciaConfirmacaoId: null,
      resumo: dados.resumo.interpretacao_necessidade, resumoEstruturado: dados.resumo,
      status: "resumo_preparado",
    }).where(and(
      eq(atendimentoIaTransferenciasTable.id, dados.id),
      inArray(atendimentoIaTransferenciasTable.status, ["oferecido", "resumo_preparado", "aguardando_confirmacao", "confirmado", "falha_ao_gerar_link"]),
    )).returning({ id: atendimentoIaTransferenciasTable.id });
    return Boolean(registro);
  }

  async atualizarDestinatario(dados: Parameters<RepositorioTransferenciaHumana["atualizarDestinatario"]>[0]) {
    const [registro] = await dbTransacional.update(atendimentoIaTransferenciasTable)
      .set({ atualizadoEm: new Date(), referenciaDestinatarioHash: dados.referenciaDestinatarioHash })
      .where(eq(atendimentoIaTransferenciasTable.id, dados.id)).returning({ id: atendimentoIaTransferenciasTable.id });
    return Boolean(registro);
  }

  async registrarConfirmacao(dados: Parameters<RepositorioTransferenciaHumana["registrarConfirmacao"]>[0]) {
    const [registro] = await dbTransacional.update(atendimentoIaTransferenciasTable)
      .set({ atualizadoEm: dados.confirmadoEm, confirmadoEm: dados.confirmadoEm, referenciaConfirmacaoId: dados.referenciaConfirmacaoId })
      .where(and(eq(atendimentoIaTransferenciasTable.id, dados.id), eq(atendimentoIaTransferenciasTable.status, "aguardando_confirmacao")))
      .returning({ id: atendimentoIaTransferenciasTable.id });
    return Boolean(registro);
  }

  async registrarReferenciaConfirmacao(dados: Parameters<RepositorioTransferenciaHumana["registrarReferenciaConfirmacao"]>[0]) {
    const [registro] = await dbTransacional.update(atendimentoIaTransferenciasTable)
      .set({ atualizadoEm: new Date(), referenciaConfirmacaoId: dados.referenciaConfirmacaoId })
      .where(and(eq(atendimentoIaTransferenciasTable.id, dados.id), eq(atendimentoIaTransferenciasTable.status, "aguardando_confirmacao")))
      .returning({ id: atendimentoIaTransferenciasTable.id });
    return Boolean(registro);
  }

  async transicionar(dados: Parameters<RepositorioTransferenciaHumana["transicionar"]>[0]) {
    const instante = dados.instante ?? new Date();
    const extras: Record<string, Date> = {};
    if (dados.para === "link_gerado") extras.linkGeradoEm = instante;
    if (dados.para === "whatsapp_aberto") extras.whatsappAbertoEm = instante;
    const [registro] = await dbTransacional.update(atendimentoIaTransferenciasTable)
      .set({ atualizadoEm: instante, status: dados.para, ...extras })
      .where(and(eq(atendimentoIaTransferenciasTable.id, dados.id), inArray(atendimentoIaTransferenciasTable.status, dados.de)))
      .returning({ id: atendimentoIaTransferenciasTable.id });
    return Boolean(registro);
  }

  async auditar(evento: string, dados: Record<string, unknown>) {
    await new RepositorioSegurancaObservabilidadeDrizzle().registrar({
      categoria: "operacao",
      correlacaoId: criarCorrelacaoSegura(),
      evento,
      metadados: dados,
      resultado: evento.includes("recusada") ? "recusa" : "sucesso_comprovado",
      severidade: "informativo",
      tipoAtor: "sistema",
    });
  }
}
