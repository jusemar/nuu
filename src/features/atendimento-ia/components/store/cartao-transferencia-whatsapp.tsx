"use client";

import { ExternalLink, MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { ResumoTransferencia } from "../../schemas/transferencia-humana.schema";
import type { EstadoTransferenciaWhatsapp } from "../../types/transferencia-humana";

type Props = {
  explicacao: string;
  link?: string | null;
  resumo?: ResumoTransferencia | null;
  status: EstadoTransferenciaWhatsapp;
  transferenciaId: string;
  resumoParaPreparar?: {
    informacoesDeclaradas: string[];
    interpretacaoNecessidade: string;
    necessidadePrincipal: string;
    pendenciaValidacaoHumana: string;
    produtoRelacionado: string | null;
  };
  aoAtualizar?: () => void;
  aoSolicitarCorrecao?: () => void;
};

export function CartaoTransferenciaWhatsapp({
  aoAtualizar,
  aoSolicitarCorrecao,
  explicacao,
  link,
  resumo,
  resumoParaPreparar,
  status,
  transferenciaId,
}: Props) {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [estadoAtual, setEstadoAtual] = useState(status);
  const [linkAtual, setLinkAtual] = useState(link);
  const [resumoAtual, setResumoAtual] = useState(resumo);

  async function requisitar(acao: string, extras: Record<string, unknown> = {}) {
    const resposta = await fetch("/api/atendimento-ia/transferencias", {
      body: JSON.stringify({ acao, transferenciaId, ...extras }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const corpo = (await resposta.json()) as { dados?: unknown };
    if (!resposta.ok) throw new Error("FALHA_TRANSFERENCIA");
    return corpo.dados;
  }

  async function executar(acao: string, extras: Record<string, unknown> = {}) {
    setProcessando(true);
    setErro(null);
    try {
      const dados = await requisitar(acao, extras);
      if (acao === "confirmar_oferta" && resumoParaPreparar) {
        const preparado = await requisitar("preparar_resumo_publico", resumoParaPreparar) as { resumo?: ResumoTransferencia };
        if (!preparado?.resumo) throw new Error("RESUMO_TRANSFERENCIA_INDISPONIVEL");
        setResumoAtual(preparado.resumo);
        setEstadoAtual("aguardando_confirmacao");
      } else if (acao === "recusar") setEstadoAtual("recusado");
      else if (acao === "cancelar") setEstadoAtual("cancelado");
      else if (acao === "confirmar_resumo" && dados === true) setEstadoAtual("confirmado");
      else if (acao === "gerar_link" && dados && typeof dados === "object") {
        const resultado = dados as { link?: unknown; status?: unknown };
        if (resultado.status === "link_gerado" && typeof resultado.link === "string" && resultado.link.startsWith("https://wa.me/")) {
          setLinkAtual(resultado.link);
          setEstadoAtual("link_gerado");
        } else setEstadoAtual("falha_ao_gerar_link");
      }
      aoAtualizar?.();
    } catch {
      setErro("Não foi possível atualizar o encaminhamento. O chat continua disponível.");
    } finally {
      setProcessando(false);
    }
  }

  async function continuarPeloWhatsapp(confirmarResumo: boolean) {
    const janelaWhatsapp = window.open("about:blank", "_blank");
    if (!janelaWhatsapp) {
      setErro("O navegador bloqueou a abertura do WhatsApp. Permita pop-ups e tente novamente.");
      return;
    }
    janelaWhatsapp.opener = null;
    setProcessando(true);
    setErro(null);
    try {
      if (confirmarResumo) {
        const confirmado = await requisitar("confirmar_resumo", {
          resposta: "sim",
        });
        if (confirmado !== true) throw new Error("CONFIRMACAO_RESUMO_RECUSADA");
      }
      const resultado = (await requisitar("gerar_link", {
        chaveIdempotencia: crypto.randomUUID(),
      })) as { link?: unknown; status?: unknown };
      if (
        resultado.status !== "link_gerado" ||
        typeof resultado.link !== "string" ||
        !resultado.link.startsWith("https://wa.me/")
      ) {
        throw new Error("LINK_WHATSAPP_INDISPONIVEL");
      }
      setLinkAtual(resultado.link);
      setEstadoAtual("link_gerado");
      janelaWhatsapp.location.replace(resultado.link);
      const aberturaRegistrada = await requisitar("registrar_abertura");
      if (aberturaRegistrada === true) setEstadoAtual("whatsapp_aberto");
      aoAtualizar?.();
    } catch {
      janelaWhatsapp.close();
      setEstadoAtual("falha_ao_gerar_link");
      setErro("Não foi possível abrir o WhatsApp. O chat continua disponível.");
    } finally {
      setProcessando(false);
    }
  }

  if (["recusado", "cancelado", "expirado"].includes(estadoAtual)) return null;

  return (
    <Card className="border-primary/25 mt-4" aria-live="polite">
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <MessageCircle className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">Atendimento pelo WhatsApp</h3>
            <p className="text-muted-foreground mt-1 text-sm">{explicacao}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Preparamos um resumo da sua solicitação para você continuar o atendimento pelo WhatsApp. Ao abrir o WhatsApp, a mensagem estará pronta para envio.
            </p>
          </div>
        </div>

        {resumoAtual ? (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p>{resumoAtual.interpretacao_necessidade}</p>
            <p className="text-muted-foreground mt-2 text-xs">Revise este resumo antes de continuar. Nenhuma mensagem será enviada automaticamente.</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {estadoAtual === "oferecido" ? (
            <>
              <Button disabled={processando} onClick={() => executar("confirmar_oferta")}>Continuar pelo WhatsApp</Button>
              <Button disabled={processando} variant="outline" onClick={() => executar("recusar")}>Agora não</Button>
            </>
          ) : null}
          {estadoAtual === "aguardando_confirmacao" ? (
            <>
              <Button disabled={processando} onClick={() => continuarPeloWhatsapp(true)}>Continuar pelo WhatsApp</Button>
              <Button disabled={processando} variant="outline" onClick={() => executar("cancelar")}><X aria-hidden="true" />Cancelar</Button>
              {aoSolicitarCorrecao ? <Button disabled={processando} variant="ghost" onClick={aoSolicitarCorrecao}>Corrigir resumo</Button> : null}
            </>
          ) : null}
          {estadoAtual === "confirmado" || estadoAtual === "falha_ao_gerar_link" ? (
            <Button disabled={processando} onClick={() => continuarPeloWhatsapp(false)}>Continuar pelo WhatsApp</Button>
          ) : null}
          {estadoAtual === "link_gerado" && linkAtual ? (
            <Button asChild>
              <a href={linkAtual} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" />Continuar pelo WhatsApp</a>
            </Button>
          ) : null}
        </div>
        {["link_gerado", "whatsapp_aberto"].includes(estadoAtual) ? <p className="text-muted-foreground text-xs">Abrir o WhatsApp não confirma envio, recebimento ou início do atendimento humano.</p> : null}
        {erro ? <p className="text-destructive text-sm" role="alert">{erro}</p> : null}
      </CardContent>
    </Card>
  );
}
