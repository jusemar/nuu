import { randomUUID } from "node:crypto";

import { CANAL_TRANSFERENCIA_INICIAL, MOTIVOS_TRANSFERENCIA_HUMANA } from "../../constants/transferencia-humana";
import type { RepositorioConfirmacoesFerramentas } from "../../types/confirmacoes-ferramentas";
import type { IdentidadeEntradaAtendimento } from "../../types/entrada-mensagem";
import type { MotivoTransferenciaHumana, RepositorioTransferenciaHumana } from "../../types/transferencia-humana";
import { criarGestorConfirmacoesFerramentas, hashParametrosConfirmacao } from "../ferramentas-protegidas/confirmacoes-ferramentas";
import { gerarLinkWhatsappOficial, hashSeguro, normalizarWhatsappOficial, sanitizarResumoTransferencia } from "./gerar-link-whatsapp";

export function motivoTransferenciaValido(motivo: string): motivo is MotivoTransferenciaHumana {
  return MOTIVOS_TRANSFERENCIA_HUMANA.includes(motivo as MotivoTransferenciaHumana);
}

export function deveOferecerTransferencia(dados: {
  capacidadesSegurasDisponiveis: boolean;
  motivo: MotivoTransferenciaHumana;
}) {
  return dados.motivo === "solicitacao_cliente" ||
    dados.motivo === "situacao_sensivel" ||
    !dados.capacidadesSegurasDisponiveis;
}

export function criarFluxoTransferenciaWhatsapp(dependencias: {
  agora?: () => Date;
  obterWhatsappOficial: () => string | undefined;
  repositorio: RepositorioTransferenciaHumana;
  repositorioConfirmacoes: RepositorioConfirmacoesFerramentas;
  validarDadosParticulares: (dados: {
    identidade: IdentidadeEntradaAtendimento;
    resumo: ReturnType<typeof sanitizarResumoTransferencia>;
  }) => Promise<boolean>;
  validadeEmMs: number;
}) {
  const agora = dependencias.agora ?? (() => new Date());
  const gestor = criarGestorConfirmacoesFerramentas({
    agora,
    repositorio: dependencias.repositorioConfirmacoes,
    validadeEmMs: dependencias.validadeEmMs,
  });

  return {
    async oferecer(dados: {
      capacidadesSegurasDisponiveis: boolean;
      chaveIdempotencia: string;
      conversaId: string;
      execucaoId: string;
      identidade: IdentidadeEntradaAtendimento;
      mensagemId: string | null;
      motivo: MotivoTransferenciaHumana;
    }) {
      if (!deveOferecerTransferencia(dados)) return null;
      const transferencia = await dependencias.repositorio.criarOferta({
        ...dados,
        referenciaSessaoHash: hashSeguro(dados.identidade.identificadorSessao),
      });
      await dependencias.repositorio.auditar("transferencia_whatsapp_oferecida", {
        conversaId: dados.conversaId,
        motivo: dados.motivo,
        transferenciaId: transferencia.id,
      });
      return transferencia;
    },

    async responderOferta(dados: {
      aceitar: boolean;
      identidade: IdentidadeEntradaAtendimento;
      transferenciaId: string;
    }) {
      const transferencia = await dependencias.repositorio.buscar(dados.transferenciaId, dados.identidade);
      if (!transferencia || transferencia.status !== "oferecido") return false;
      if (!dados.aceitar) {
        const recusada = await dependencias.repositorio.transicionar({ de: ["oferecido"], id: transferencia.id, para: "recusado" });
        if (recusada) await dependencias.repositorio.auditar("transferencia_whatsapp_recusada", { conversaId: transferencia.conversaId, transferenciaId: transferencia.id });
        return recusada;
      }
      const aceita = await dependencias.repositorio.registrarAceiteOferta({ id: transferencia.id, instante: agora() });
      if (aceita) await dependencias.repositorio.auditar("transferencia_whatsapp_oferta_aceita", { conversaId: transferencia.conversaId, transferenciaId: transferencia.id });
      return aceita;
    },

    async prepararResumo(dados: {
      contemDadosParticulares: boolean;
      identidade: IdentidadeEntradaAtendimento;
      resumo: unknown;
      transferenciaId: string;
    }) {
      const transferencia = await dependencias.repositorio.buscar(dados.transferenciaId, dados.identidade);
      if (!transferencia || !["oferecido", "resumo_preparado", "aguardando_confirmacao", "confirmado", "falha_ao_gerar_link"].includes(transferencia.status) || !transferencia.ofertaConfirmadaEm) return null;
      const resumo = sanitizarResumoTransferencia(dados.resumo);
      if (resumo.motivo !== transferencia.motivo) return null;
      if (dados.contemDadosParticulares) {
        if (!dados.identidade.usuarioId || !await dependencias.validarDadosParticulares({ identidade: dados.identidade, resumo })) return null;
      }
      const numero = normalizarWhatsappOficial(dependencias.obterWhatsappOficial());
      const destinatarioHash = hashSeguro(numero ?? "whatsapp_oficial_indisponivel");
      const hashResumo = hashSeguro(JSON.stringify(resumo));
      const expiraEm = new Date(agora().getTime() + dependencias.validadeEmMs);
      if (!await dependencias.repositorio.prepararResumo({ expiraEm, hashResumo, id: transferencia.id, resumo })) return null;
      await dependencias.repositorio.atualizarDestinatario({ id: transferencia.id, referenciaDestinatarioHash: destinatarioHash });
      await dependencias.repositorio.transicionar({ de: ["resumo_preparado"], id: transferencia.id, para: "aguardando_confirmacao" });
      const vinculo = {
        acao: "gerar_link_whatsapp",
        conversaId: transferencia.conversaId,
        execucaoId: transferencia.execucaoId!,
        ferramenta: "gerar_link_whatsapp_oficial",
        parametrosEssenciais: { canal: CANAL_TRANSFERENCIA_INICIAL, destinatarioHash, hashResumo, motivo: transferencia.motivo },
        recursoId: transferencia.id,
        recursoTipo: "transferencia_whatsapp",
        referenciaSessaoHash: transferencia.referenciaSessaoHash,
        usuarioId: transferencia.usuarioId,
      };
      const confirmacao = await gestor.solicitar(vinculo);
      if (!await dependencias.repositorio.registrarReferenciaConfirmacao({
        id: transferencia.id,
        referenciaConfirmacaoId: confirmacao.id,
      })) return null;
      await dependencias.repositorio.auditar("transferencia_whatsapp_resumo_apresentado", {
        conversaId: transferencia.conversaId,
        hashResumo,
        transferenciaId: transferencia.id,
      });
      return { confirmacaoId: confirmacao.id, expiraEm, resumo };
    },

    async confirmarResumo(dados: {
      identidade: IdentidadeEntradaAtendimento;
      resposta: string;
      transferenciaId: string;
    }) {
      const transferencia = await dependencias.repositorio.buscar(dados.transferenciaId, dados.identidade);
      if (!transferencia || transferencia.status !== "aguardando_confirmacao" || !transferencia.hashResumo || !transferencia.referenciaConfirmacaoId) return false;
      if (!transferencia.expiraEm || transferencia.expiraEm <= agora()) {
        await dependencias.repositorio.transicionar({ de: ["aguardando_confirmacao"], id: transferencia.id, para: "expirado" });
        return false;
      }
      const esperada = await dependencias.repositorioConfirmacoes.buscar(transferencia.referenciaConfirmacaoId);
      if (!esperada || esperada.status !== "pendente") return false;
      const confirmacao = await gestor.responder({
        conversaId: transferencia.conversaId,
        referenciaSessaoHash: transferencia.referenciaSessaoHash,
        resposta: dados.resposta,
        usuarioId: transferencia.usuarioId,
      });
      if (!confirmacao || confirmacao.id !== esperada.id) return false;
      const registrada = await dependencias.repositorio.registrarConfirmacao({ confirmadoEm: agora(), id: transferencia.id, referenciaConfirmacaoId: confirmacao.id });
      return registrada && dependencias.repositorio.transicionar({ de: ["aguardando_confirmacao"], id: transferencia.id, para: "confirmado" });
    },

    async cancelar(dados: { identidade: IdentidadeEntradaAtendimento; transferenciaId: string }) {
      const transferencia = await dependencias.repositorio.buscar(dados.transferenciaId, dados.identidade);
      if (!transferencia) return false;
      await gestor.cancelar({ conversaId: transferencia.conversaId, usuarioId: transferencia.usuarioId });
      return dependencias.repositorio.transicionar({ de: ["oferecido", "resumo_preparado", "aguardando_confirmacao", "confirmado", "falha_ao_gerar_link"], id: transferencia.id, para: "cancelado" });
    },

    async gerarLink(dados: { chaveIdempotencia: string; identidade: IdentidadeEntradaAtendimento; transferenciaId: string }) {
      const transferencia = await dependencias.repositorio.buscar(dados.transferenciaId, dados.identidade);
      if (!transferencia?.resumo || !transferencia.referenciaConfirmacaoId || !transferencia.hashResumo || !transferencia.execucaoId) return { link: null, status: "falha_ao_gerar_link" as const };
      const confirmacao = await dependencias.repositorioConfirmacoes.buscar(transferencia.referenciaConfirmacaoId);
      if (!confirmacao) return { link: null, status: "falha_ao_gerar_link" as const };
      const numero = normalizarWhatsappOficial(dependencias.obterWhatsappOficial());
      if (!numero) {
        await dependencias.repositorio.transicionar({ de: ["confirmado", "falha_ao_gerar_link"], id: transferencia.id, para: "falha_ao_gerar_link" });
        return { link: null, status: dependencias.obterWhatsappOficial() ? "configuracao_invalida" as const : "configuracao_ausente" as const };
      }
      const destinatarioHash = hashSeguro(numero);
      const vinculoAtual = {
        acao: "gerar_link_whatsapp", conversaId: transferencia.conversaId,
        execucaoId: transferencia.execucaoId, ferramenta: "gerar_link_whatsapp_oficial",
        parametrosEssenciais: { canal: CANAL_TRANSFERENCIA_INICIAL, destinatarioHash, hashResumo: transferencia.hashResumo, motivo: transferencia.motivo },
        recursoId: transferencia.id, recursoTipo: "transferencia_whatsapp",
        referenciaSessaoHash: transferencia.referenciaSessaoHash, usuarioId: transferencia.usuarioId,
      };
      if (hashParametrosConfirmacao(vinculoAtual) !== confirmacao.hashParametros || destinatarioHash !== transferencia.referenciaDestinatarioHash) return { link: null, status: "falha_ao_gerar_link" as const };
      const resultado = await gestor.executar({
        chaveIdempotencia: dados.chaveIdempotencia,
        confirmacao,
        execucaoId: transferencia.execucaoId,
        executarEfeito: async () => ({ dados: { linkHash: hashSeguro(gerarLinkWhatsappOficial(numero, transferencia.resumo!)) }, status: "concluida" }),
        revalidar: async () => {
          const atual = await dependencias.repositorio.buscar(transferencia.id, dados.identidade);
          return atual && ["confirmado", "link_gerado", "falha_ao_gerar_link"].includes(atual.status) ? "autorizada" : "nao_autorizada";
        },
        vinculoAtual,
      });
      if (!["concluida", "ja_executada"].includes(resultado.status)) {
        return { link: null, status: resultado.status === "resultado_incerto" ? "resultado_incerto" as const : "falha_ao_gerar_link" as const };
      }
      const link = gerarLinkWhatsappOficial(numero, transferencia.resumo);
      await dependencias.repositorio.transicionar({ de: ["confirmado", "falha_ao_gerar_link", "link_gerado"], id: transferencia.id, para: "link_gerado", instante: agora() });
      return { link, status: "link_gerado" as const };
    },

    async registrarAbertura(dados: { identidade: IdentidadeEntradaAtendimento; transferenciaId: string }) {
      const transferencia = await dependencias.repositorio.buscar(dados.transferenciaId, dados.identidade);
      if (!transferencia) return false;
      return dependencias.repositorio.transicionar({ de: ["link_gerado", "whatsapp_aberto"], id: transferencia.id, para: "whatsapp_aberto", instante: agora() });
    },
  };
}

export function criarIdentificadorSeguroAtendimento() {
  return `ATD-${randomUUID().slice(0, 8).toUpperCase()}`;
}
