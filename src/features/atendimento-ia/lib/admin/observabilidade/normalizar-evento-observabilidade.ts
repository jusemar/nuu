import { classificarFalha } from "./classificar-falha";
import { sanitizarLogAdministrativo } from "./sanitizar-log-administrativo";

export function normalizarEventoObservabilidade(entrada: {
  codigo: string;
  criadoEm: Date;
  metadados?: Record<string, unknown> | null;
  origem: string;
}) {
  return {
    classe: classificarFalha(entrada.codigo),
    codigo: entrada.codigo.slice(0, 120),
    criadoEm: entrada.criadoEm,
    metadados: sanitizarLogAdministrativo(entrada.metadados ?? {}),
    origem: entrada.origem.slice(0, 120),
  };
}
