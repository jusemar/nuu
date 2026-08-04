export function validarOrigemRestauracao(entrada: {
  recursoEsperadoId: string;
  recursoOrigemId: string;
  versaoOrigemId: string | null;
}) {
  if (!entrada.versaoOrigemId)
    throw new Error("VERSAO_HISTORICA_NAO_ENCONTRADA");
  if (entrada.recursoOrigemId !== entrada.recursoEsperadoId)
    throw new Error("RECURSO_RESTAURACAO_INCORRETO");
  return true;
}
