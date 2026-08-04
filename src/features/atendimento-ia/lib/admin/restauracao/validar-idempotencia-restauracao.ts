export function validarIdempotenciaRestauracao(
  existente: { identidade: string; novaVersaoId: string } | null,
  identidade: string,
) {
  if (!existente) return null;
  if (existente.identidade !== identidade)
    throw new Error("CHAVE_IDEMPOTENCIA_REUTILIZADA");
  return existente.novaVersaoId;
}
