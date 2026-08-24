import { createHmac, randomInt, randomUUID } from "node:crypto";

import type { FinalidadeOtpTelefone } from "../../types/otp-telefone.types";
import { POLITICA_OTP_TELEFONE } from "./politica-otp-telefone";

export function gerarCodigoOtpTelefone() {
  const limite = 10 ** POLITICA_OTP_TELEFONE.digitos;
  return randomInt(0, limite)
    .toString()
    .padStart(POLITICA_OTP_TELEFONE.digitos, "0");
}

export function gerarIdentificadorOperacaoOtp() {
  return randomUUID();
}

export function criarHashIdentificador(valor: string, segredo: string) {
  return createHmac("sha256", segredo)
    .update(`identificador:${valor}`)
    .digest("hex");
}

export function criarHashCodigoOtp(entrada: {
  codigo: string;
  telefoneHash: string;
  finalidade: FinalidadeOtpTelefone;
  segredo: string;
}) {
  return createHmac("sha256", entrada.segredo)
    .update(
      `otp:${entrada.telefoneHash}:${entrada.finalidade}:${entrada.codigo}`,
    )
    .digest("hex");
}
