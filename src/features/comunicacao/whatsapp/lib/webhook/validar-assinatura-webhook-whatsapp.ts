import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/** A Meta envia a assinatura no formato `sha256=<hex>`. */
const PREFIXO_ASSINATURA_META = "sha256=";

/**
 * Compara dois textos sem vazar informação pelo tempo de execução.
 *
 * Uma comparação comum com `===` para assim que encontra o primeiro byte
 * diferente, o que permitiria a um atacante descobrir a assinatura correta
 * byte a byte medindo a latência das respostas.
 */
export function compararEmTempoConstante(
  primeiro: string,
  segundo: string,
): boolean {
  const bufferPrimeiro = Buffer.from(primeiro, "utf8");
  const bufferSegundo = Buffer.from(segundo, "utf8");

  // `timingSafeEqual` exige buffers do mesmo tamanho; tamanhos diferentes já
  // provam a diferença e podem ser recusados sem comparar conteúdo.
  if (bufferPrimeiro.length !== bufferSegundo.length) {
    return false;
  }

  return timingSafeEqual(bufferPrimeiro, bufferSegundo);
}

/**
 * Confirma que o evento veio mesmo da Meta.
 *
 * O HMAC precisa ser calculado sobre o corpo bruto exatamente como chegou:
 * fazer `JSON.parse` e reserializar mudaria espaços e ordem de chaves, e a
 * assinatura deixaria de bater mesmo com o segredo correto.
 */
export function validarAssinaturaWebhookWhatsapp({
  corpoBruto,
  assinaturaRecebida,
  segredoAplicacao,
}: {
  corpoBruto: string;
  assinaturaRecebida: string | null;
  segredoAplicacao: string;
}): boolean {
  if (!assinaturaRecebida?.startsWith(PREFIXO_ASSINATURA_META)) {
    return false;
  }

  const assinaturaEsperada =
    PREFIXO_ASSINATURA_META +
    createHmac("sha256", segredoAplicacao)
      .update(corpoBruto, "utf8")
      .digest("hex");

  return compararEmTempoConstante(assinaturaRecebida, assinaturaEsperada);
}
