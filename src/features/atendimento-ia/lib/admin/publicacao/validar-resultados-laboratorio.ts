import type {
  BloqueioPublicacao,
  EvidenciaResultadoLaboratorio,
} from "../../../types/admin/publicacao";
import { classificarRegressao } from "./classificar-regressao";
export function validarResultadosLaboratorio(
  resultados: EvidenciaResultadoLaboratorio[],
  hashAtual: string,
): BloqueioPublicacao[] {
  if (!resultados.length) return [];
  const bloqueios: BloqueioPublicacao[] = [];
  for (const resultado of resultados) {
    if (resultado.status !== "concluida") continue;
    const hashes = Object.values(resultado.hashesCongelados);
    if (!hashes.includes(hashAtual))
      bloqueios.push("resultado_laboratorio_obsoleto");
    bloqueios.push(...classificarRegressao(resultado));
  }
  return [...new Set(bloqueios)];
}
