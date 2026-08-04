import { validarDadosFicticios } from "./validar-dados-ficticios";

export function validarAnonimizacaoIrreversivel(valor: unknown) {
  validarDadosFicticios(valor);
  const texto = JSON.stringify(valor);
  if (/[*xX][*xX. -]*\d{2,}|\d{2,}[*xX][*xX. -]*/.test(texto))
    throw new Error("MASCARAMENTO_REVERSIVEL_NAO_E_ANONIMIZACAO");
  return true;
}
