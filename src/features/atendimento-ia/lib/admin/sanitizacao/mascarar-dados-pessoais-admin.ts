const EMAIL = /\b([\w.+-]{1,64})@([\w.-]+\.[a-z]{2,})\b/gi;
const TELEFONE =
  /(?<!\d)(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}(?!\d)/g;
const CEP = /\b\d{5}-?\d{3}\b/g;
const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CARTAO = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;
const PEDIDO = /\b(?:pedido|order)\s*(?:n[ºo.]?\s*)?[:#-]?\s*[a-z0-9][a-z0-9-]{3,}\b/gi;
const ENDERECO = /\b(?:rua|avenida|av\.|travessa|alameda)\s+[^\n,]{3,80}(?:,\s*\d+[a-z]?)?/gi;
const CHAVE_PIX = /\bchave\s+pix\s*[:=-]\s*\S+/gi;
const SEGREDO = /\b(?:sk-[a-z0-9_-]+|bearer\s+[a-z0-9._-]+|api[_ -]?key\s*[:=]\s*\S+|password\s*[:=]\s*\S+)\b/gi;

export function mascararDadosPessoaisAdmin(valor: string, limite = 2_000) {
  return valor
    .slice(0, limite)
    .replace(
      EMAIL,
      (_: string, _inicio: string, dominio: string) =>
        `***@***.${dominio.split(".").at(-1) ?? "***"}`,
    )
    .replace(TELEFONE, "(**) *****-****")
    .replace(CEP, "*****-***")
    .replace(CPF, "***.***.***-**")
    .replace(CARTAO, "**** **** **** ****")
    .replace(PEDIDO, "pedido [IDENTIFICADOR PROTEGIDO]")
    .replace(ENDERECO, "[ENDEREÇO PROTEGIDO]")
    .replace(CHAVE_PIX, "chave PIX [DADO PROTEGIDO]")
    .replace(SEGREDO, "[DADO PROTEGIDO]");
}

export function identificadorAdministrativoSeguro(id: string) {
  return `ATD-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}
