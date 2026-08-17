/**
 * Lê exclusivamente a origem logística da Laquila. Não existe fallback para a
 * origem da loja: uma configuração ausente precisa bloquear a cotação do grupo.
 */
export function obterCepOrigemLaquila() {
  const cep = process.env.LAQUILA_CEP_ORIGEM?.trim();
  return cep && /^\d{8}$/u.test(cep) ? cep : null;
}
