import { conteudoMudancaWebhookWhatsappSchema } from "../../schemas/webhook-whatsapp.schema";
import type {
  EventoWebhookWhatsapp,
  ResumoEventoWebhookWhatsapp,
  ResumoMensagemWebhookWhatsapp,
  ResumoStatusWebhookWhatsapp,
} from "../../types/webhook-whatsapp.types";

const IDENTIFICADOR_DESCONHECIDO = "desconhecido";

/** Quantos dígitos ficam visíveis nas pontas do número mascarado. */
const DIGITOS_VISIVEIS_INICIO = 2;
const DIGITOS_VISIVEIS_FIM = 4;

/**
 * Máscara própria do webhook.
 *
 * Diferente de `mascararTelefoneWhatsapp`, esta versão aceita qualquer número
 * internacional e nunca lança erro: quem manda mensagem para a loja não está
 * sob controle da aplicação, e um número fora do padrão brasileiro não pode
 * derrubar o processamento do evento.
 */
export function mascararIdentificadorRecebido(valor: string | undefined) {
  if (!valor) return IDENTIFICADOR_DESCONHECIDO;

  const somenteDigitos = valor.replace(/\D/g, "");

  // Número curto demais para mascarar parcialmente: some com ele por inteiro.
  if (somenteDigitos.length <= DIGITOS_VISIVEIS_INICIO + DIGITOS_VISIVEIS_FIM) {
    return "*".repeat(somenteDigitos.length || 1);
  }

  const ocultos =
    somenteDigitos.length - DIGITOS_VISIVEIS_INICIO - DIGITOS_VISIVEIS_FIM;

  return [
    somenteDigitos.slice(0, DIGITOS_VISIVEIS_INICIO),
    "*".repeat(ocultos),
    somenteDigitos.slice(-DIGITOS_VISIVEIS_FIM),
  ].join("");
}

/**
 * Reduz o evento ao que pode ser observado com segurança.
 *
 * O que entra: quais campos mudaram, quantas mensagens chegaram, o tipo delas
 * e os status de entrega. O que nunca entra: o texto da mensagem, mídias,
 * nomes de contato e o número completo de quem escreveu.
 */
export function resumirEventoWebhookWhatsapp(
  evento: EventoWebhookWhatsapp,
): ResumoEventoWebhookWhatsapp {
  const campos: string[] = [];
  const mensagens: ResumoMensagemWebhookWhatsapp[] = [];
  const atualizacoesDeStatus: ResumoStatusWebhookWhatsapp[] = [];

  for (const entrada of evento.entry) {
    for (const mudanca of entrada.changes ?? []) {
      campos.push(mudanca.field);

      // Leitura tolerante: um campo assinado que ainda não conhecemos é
      // contabilizado em `campos` e segue adiante sem quebrar nada.
      const conteudo = conteudoMudancaWebhookWhatsappSchema.safeParse(
        mudanca.value,
      );

      if (!conteudo.success) continue;

      for (const mensagem of conteudo.data.messages ?? []) {
        mensagens.push({
          idMensagem: mensagem.id ?? IDENTIFICADOR_DESCONHECIDO,
          tipo: mensagem.type ?? IDENTIFICADOR_DESCONHECIDO,
          remetenteMascarado: mascararIdentificadorRecebido(mensagem.from),
        });
      }

      for (const status of conteudo.data.statuses ?? []) {
        atualizacoesDeStatus.push({
          idMensagem: status.id ?? IDENTIFICADOR_DESCONHECIDO,
          status: status.status ?? IDENTIFICADOR_DESCONHECIDO,
          destinatarioMascarado: mascararIdentificadorRecebido(
            status.recipient_id,
          ),
          // Só o diagnóstico da Meta: código, título e detalhe. Nada aqui
          // deriva do conteúdo da mensagem enviada.
          erros: (status.errors ?? []).map((erro) => ({
            codigo: erro.code,
            titulo: erro.title,
            detalhe: erro.error_data?.details,
          })),
        });
      }
    }
  }

  return {
    objeto: evento.object,
    totalEntradas: evento.entry.length,
    campos: [...new Set(campos)],
    mensagens,
    atualizacoesDeStatus,
  };
}
