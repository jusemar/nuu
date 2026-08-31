import "server-only";

import { NextResponse } from "next/server";

import { eventoWebhookWhatsappSchema } from "../../schemas/webhook-whatsapp.schema";
import type { ConfiguracaoWebhookWhatsapp } from "../../types/webhook-whatsapp.types";
import { obterConfiguracaoWebhookWhatsapp } from "./configuracao-webhook-whatsapp";
import { resumirEventoWebhookWhatsapp } from "./resumir-evento-webhook-whatsapp";
import { validarAssinaturaWebhookWhatsapp } from "./validar-assinatura-webhook-whatsapp";
import { verificarInscricaoWebhookWhatsapp } from "./verificar-inscricao-webhook-whatsapp";

const CABECALHO_ASSINATURA_META = "x-hub-signature-256";

/**
 * Resolve a configuração devolvendo uma resposta pronta quando ela falta.
 *
 * Sem credencial não há como distinguir a Meta de um desconhecido, então a
 * rota responde 503 em vez de aceitar qualquer coisa.
 */
function resolverConfiguracao():
  | { ok: true; configuracao: ConfiguracaoWebhookWhatsapp }
  | { ok: false; resposta: NextResponse } {
  try {
    return { ok: true, configuracao: obterConfiguracaoWebhookWhatsapp() };
  } catch (erro) {
    console.error("Webhook WhatsApp sem configuração no servidor.", {
      message: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      ok: false,
      resposta: NextResponse.json(
        { error: "Webhook WhatsApp indisponível." },
        { status: 503 },
      ),
    };
  }
}

/** `GET` — handshake de verificação disparado pela Meta ao salvar a URL. */
export async function responderVerificacaoWebhookWhatsapp(request: Request) {
  const configuracao = resolverConfiguracao();

  if (!configuracao.ok) return configuracao.resposta;

  const { searchParams } = new URL(request.url);

  const resultado = verificarInscricaoWebhookWhatsapp({
    parametros: searchParams,
    tokenVerificacao: configuracao.configuracao.tokenVerificacao,
  });

  if (!resultado.autorizado) {
    console.warn("Verificação de webhook WhatsApp recusada.", {
      motivo: resultado.motivo,
    });

    return new NextResponse("Forbidden", { status: 403 });
  }

  // A Meta espera o desafio devolvido como texto puro. Responder JSON aqui
  // faz a verificação falhar no painel, mesmo com o token correto.
  return new NextResponse(resultado.desafio, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

/** `POST` — recebimento dos eventos assinados (mensagens, status, templates). */
export async function responderEventoWebhookWhatsapp(request: Request) {
  const configuracao = resolverConfiguracao();

  if (!configuracao.ok) return configuracao.resposta;

  // Corpo lido como texto bruto antes de qualquer parse: a assinatura é
  // calculada sobre estes bytes exatos.
  const corpoBruto = await request.text();

  const assinaturaValida = validarAssinaturaWebhookWhatsapp({
    corpoBruto,
    assinaturaRecebida: request.headers.get(CABECALHO_ASSINATURA_META),
    segredoAplicacao: configuracao.configuracao.segredoAplicacao,
  });

  if (!assinaturaValida) {
    // Nada do corpo é registrado: a origem não foi provada, então o conteúdo
    // é entrada arbitrária de terceiro.
    console.warn("Evento de webhook WhatsApp descartado por assinatura inválida.");

    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  // Daqui em diante a origem está provada.
  const corpoInterpretado = interpretarCorpoEvento(corpoBruto);

  if (!corpoInterpretado.ok) {
    // Formato inesperado ainda responde 200 de propósito: a Meta reenvia o
    // mesmo evento por dias quando não recebe 2xx, e reprocessar um payload
    // malformado não o tornaria válido.
    console.warn("Evento de webhook WhatsApp com formato inesperado.", {
      tamanhoCorpo: corpoBruto.length,
    });

    return NextResponse.json({ received: true });
  }

  const resumo = resumirEventoWebhookWhatsapp(corpoInterpretado.evento);

  // Etapa atual do projeto: apenas observabilidade segura. A entrega ao
  // atendimento IA entra depois, consumindo este mesmo resumo.
  //
  // Serializado de propósito: o console do Node colapsa estruturas aninhadas
  // em `[Array]`, o que esconderia justamente o diagnóstico de falha de
  // entrega. O resumo já é seguro por construção.
  console.info("Webhook WhatsApp recebido.", JSON.stringify(resumo));

  return NextResponse.json({ received: true });
}

/** Isola o parse para que JSON inválido e formato inesperado caiam no mesmo caminho. */
function interpretarCorpoEvento(corpoBruto: string) {
  try {
    const evento = eventoWebhookWhatsappSchema.parse(JSON.parse(corpoBruto));
    return { ok: true as const, evento };
  } catch {
    return { ok: false as const };
  }
}
