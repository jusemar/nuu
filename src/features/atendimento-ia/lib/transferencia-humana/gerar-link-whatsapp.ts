import { createHash } from "node:crypto";

import { LIMITE_RESUMO_WHATSAPP_CARACTERES } from "../../constants/transferencia-humana";
import { type ResumoTransferencia,resumoTransferenciaSchema } from "../../schemas/transferencia-humana.schema";

const PADROES_PROIBIDOS = /(?:password|senha|cookie|token|authorization|bearer|secret|segredo|chave[_ -]?api|margem|custo|fornecedor)/i;

export function normalizarWhatsappOficial(valor: string | undefined) {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, "");
  return /^55\d{10,11}$/.test(digitos) ? digitos : null;
}

export function hashSeguro(valor: string) {
  return createHash("sha256").update(valor, "utf8").digest("hex");
}

function validarTextoSeguro(valor: string) {
  if (PADROES_PROIBIDOS.test(valor)) throw new Error("RESUMO_CONTEM_DADO_PROIBIDO");
  return valor
    .replace(/https?:\/\/\S+/gi, "[link removido]")
    .replace(/([\w.+-]{1,3})[\w.+-]*(@[^\s@]+\.[^\s@]+)/gi, "$1***$2")
    .replace(/\b(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})\b/g, "$1.***.***-$2")
    .replace(/(?:\+?55\s*)?\(?([1-9]{2})\)?\s*9?\d{4}[-\s]?\d{4}\b/g, "($1) *****-****")
    .trim();
}

export function sanitizarResumoTransferencia(entrada: unknown): ResumoTransferencia {
  const resumo = resumoTransferenciaSchema.parse(entrada);
  const sanitizarLista = (itens: string[]) => itens.map(validarTextoSeguro);
  const sanitizado = {
    ...resumo,
    fatos_verificados: sanitizarLista(resumo.fatos_verificados),
    informacoes_declaradas: sanitizarLista(resumo.informacoes_declaradas),
    interpretacao_necessidade: validarTextoSeguro(resumo.interpretacao_necessidade),
    necessidade_principal: validarTextoSeguro(resumo.necessidade_principal),
    pendencia_validacao_humana: validarTextoSeguro(resumo.pendencia_validacao_humana),
    produto_ou_pedido_relacionado: resumo.produto_ou_pedido_relacionado
      ? validarTextoSeguro(resumo.produto_ou_pedido_relacionado) : null,
  };
  return resumoTransferenciaSchema.parse(sanitizado);
}

export function montarMensagemWhatsapp(resumo: ResumoTransferencia) {
  const linhas = [
    "Solicitação de atendimento humano",
    `Atendimento: ${resumo.identificador_seguro_atendimento}`,
    `Motivo: ${resumo.motivo}`,
    `Necessidade: ${resumo.necessidade_principal}`,
    resumo.produto_ou_pedido_relacionado ? `Referência informada: ${resumo.produto_ou_pedido_relacionado}` : null,
    ...resumo.fatos_verificados.map((item) => `Verificado: ${item}`),
    ...resumo.informacoes_declaradas.map((item) => `Declarado pelo cliente: ${item}`),
    `Resumo da necessidade: ${resumo.interpretacao_necessidade}`,
    `Pendente de validação humana: ${resumo.pendencia_validacao_humana}`,
    "Este resumo não autoriza alterações comerciais.",
  ].filter((item): item is string => Boolean(item));
  const mensagem = linhas.join("\n");
  if (mensagem.length > LIMITE_RESUMO_WHATSAPP_CARACTERES) throw new Error("RESUMO_EXCEDE_LIMITE");
  return mensagem;
}

export function gerarLinkWhatsappOficial(numero: string, resumo: ResumoTransferencia) {
  const normalizado = normalizarWhatsappOficial(numero);
  if (!normalizado) throw new Error("WHATSAPP_OFICIAL_INVALIDO");
  const mensagem = montarMensagemWhatsapp(sanitizarResumoTransferencia(resumo));
  return `https://wa.me/${normalizado}?text=${encodeURIComponent(mensagem)}`;
}
