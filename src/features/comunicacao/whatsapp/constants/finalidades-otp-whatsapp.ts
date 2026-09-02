/** Finalidades aceitas pelo transporte. Strings livres não atravessam a API pública. */
export const FINALIDADES_OTP_WHATSAPP = [
  "cadastro",
  "verificacao",
  "recuperacao",
  "admin_recuperacao",
  "alteracao_numero",
] as const;
