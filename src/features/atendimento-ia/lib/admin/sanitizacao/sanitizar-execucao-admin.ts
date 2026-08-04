import type {
  ExecucaoSanitizadaDto,
  FerramentaSanitizadaDto,
} from "../../../types/admin/consultas";

export function sanitizarExecucaoAdmin(
  execucao: {
    concluidoEm: Date | null;
    duracaoEmMs: number | null;
    iniciadoEm: Date;
    modelo: string;
    status: string;
    tokensEntrada: number;
    tokensSaida: number;
  },
  ferramentas: FerramentaSanitizadaDto[],
): ExecucaoSanitizadaDto {
  return {
    concluidoEm: execucao.concluidoEm?.toISOString() ?? null,
    duracaoEmMs: execucao.duracaoEmMs,
    ferramentas,
    iniciadoEm: execucao.iniciadoEm.toISOString(),
    modelo: execucao.modelo.slice(0, 80),
    status: execucao.status,
    tokensEntrada: execucao.tokensEntrada,
    tokensSaida: execucao.tokensSaida,
  };
}
