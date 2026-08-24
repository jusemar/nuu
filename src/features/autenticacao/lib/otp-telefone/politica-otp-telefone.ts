export const POLITICA_OTP_TELEFONE = {
  digitos: 6,
  validadeSegundos: 5 * 60,
  maximoTentativas: 3,
  reenvioSegundos: 60,
  maximoHora: 5,
  maximoDia: 10,
} as const;
