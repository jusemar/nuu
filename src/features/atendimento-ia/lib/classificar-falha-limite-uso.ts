export type CodigoFalhaPersistenciaLimiteUso =
  | "ESTRUTURA_LIMITE_USO_AUSENTE"
  | "INDICE_LIMITE_USO_INCOMPATIVEL"
  | "PERSISTENCIA_LIMITE_USO_INDISPONIVEL";

/** Percorre a cadeia de causas sem copiar SQL, parâmetros ou mensagens do banco. */
function obterCodigoTecnico(erro: unknown, profundidade = 0): string | null {
  if (!erro || profundidade > 4 || typeof erro !== "object") return null;
  const candidato = erro as { cause?: unknown; code?: unknown };
  if (typeof candidato.code === "string" && /^[A-Z0-9]{5}$/i.test(candidato.code)) {
    return candidato.code.toUpperCase();
  }
  return obterCodigoTecnico(candidato.cause, profundidade + 1);
}

export function classificarFalhaPersistenciaLimiteUso(
  erro: unknown,
): CodigoFalhaPersistenciaLimiteUso {
  const codigoTecnico = obterCodigoTecnico(erro);
  if (codigoTecnico === "42P01") return "ESTRUTURA_LIMITE_USO_AUSENTE";
  if (codigoTecnico === "42P10") return "INDICE_LIMITE_USO_INCOMPATIVEL";
  return "PERSISTENCIA_LIMITE_USO_INDISPONIVEL";
}
