export function validarTokenWebhookPixEfi({
  tokenRecebido,
}: {
  tokenRecebido: string | null;
}) {
  const tokenConfigurado = process.env.EFI_WEBHOOK_TOKEN?.trim();

  if (!tokenConfigurado) return false;
  return tokenRecebido === tokenConfigurado;
}
