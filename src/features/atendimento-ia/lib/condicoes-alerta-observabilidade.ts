import type { CategoriaAuditoria, SeveridadeAuditoria } from "../types/seguranca-observabilidade";

export type CondicaoAlertaInterno = {
  categoria?: CategoriaAuditoria;
  codigo: string;
  minimoEventos: number;
  severidadeMinima: SeveridadeAuditoria;
};

const ordemSeveridade: Record<SeveridadeAuditoria, number> = {
  atencao: 1,
  critico: 3,
  informativo: 0,
  risco_relevante: 2,
};

export function avaliarCondicoesAlertasInternos(
  eventos: Array<{ categoria: CategoriaAuditoria; severidade: SeveridadeAuditoria }>,
  condicoes: CondicaoAlertaInterno[],
) {
  return condicoes.filter((condicao) => eventos.filter((evento) =>
    (!condicao.categoria || evento.categoria === condicao.categoria) &&
    ordemSeveridade[evento.severidade] >= ordemSeveridade[condicao.severidadeMinima]
  ).length >= condicao.minimoEventos).map((condicao) => ({ codigo: condicao.codigo, disparado: true as const }));
}
