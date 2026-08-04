import type { FerramentaSanitizadaDto } from "../../../types/admin/consultas";

/** Argumentos, resultados, idempotência e erros brutos nunca atravessam esta projeção. */
export function sanitizarFerramentaAdmin(ferramenta: {
  classificacao: string;
  duracaoEmMs: number | null;
  nomeFerramenta: string;
  status: string;
}): FerramentaSanitizadaDto {
  return {
    classificacao: ferramenta.classificacao,
    duracaoEmMs: ferramenta.duracaoEmMs,
    nome: ferramenta.nomeFerramenta.slice(0, 120),
    status: ferramenta.status,
  };
}
