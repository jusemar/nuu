import { createHash, randomUUID } from "node:crypto";

import { CHAVES_PROIBIDAS_AUDITORIA, VERSAO_CONTRATO_AUDITORIA, VERSAO_POLITICA_SEGURANCA } from "../constants/seguranca-observabilidade";
import type { EventoAuditoriaSeguro, SeveridadeAuditoria } from "../types/seguranca-observabilidade";

const padraoSegredo = /(?:bearer\s+\S+|sk-[a-z0-9_-]+|npg_[a-z0-9]+|postgres(?:ql)?:\/\/[^\s]+)/giu;
const padraoInstrucaoMaliciosa = /(?:ignore|revele|mostre|exiba|substitua|altere).{0,40}(?:instru[cç][aã]o|prompt|sistema|permiss[aã]o|destinat[aá]rio|token)|(?:execute|rode).{0,30}(?:comando|sql|javascript|shell)|https?:\/\/\S+/iu;

export function hashReferenciaSegura(valor: string) {
  return createHash("sha256").update(valor, "utf8").digest("hex");
}

export function criarCorrelacaoSegura() {
  return randomUUID();
}

function chaveProibida(chave: string) {
  const normalizada = chave.toLowerCase();
  return CHAVES_PROIBIDAS_AUDITORIA.some((item) => normalizada.includes(item));
}

export function sanitizarMetadadosAuditoria(valor: unknown, profundidade = 0): unknown {
  if (profundidade > 4) return "[profundidade_removida]";
  if (typeof valor === "string") {
    return valor.replace(padraoSegredo, "[segredo_removido]").slice(0, 300);
  }
  if (typeof valor === "number" || typeof valor === "boolean" || valor === null) return valor;
  if (Array.isArray(valor)) return valor.slice(0, 10).map((item) => sanitizarMetadadosAuditoria(item, profundidade + 1));
  if (typeof valor !== "object") return undefined;
  return Object.fromEntries(Object.entries(valor as Record<string, unknown>)
    .filter(([chave]) => !chaveProibida(chave))
    .slice(0, 30)
    .map(([chave, item]) => [chave, sanitizarMetadadosAuditoria(item, profundidade + 1)]));
}

export function detectarConteudoNaoConfiavel(valor: string) {
  return padraoInstrucaoMaliciosa.test(valor);
}

export function classificarSeveridade(dados: { acessoIndevidoPossivel?: boolean; acaoExecutada?: boolean; dadosSensiveis?: boolean; repeticoes?: number; resultadoIncerto?: boolean }): SeveridadeAuditoria {
  if (dados.acaoExecutada && dados.acessoIndevidoPossivel && dados.dadosSensiveis) return "critico";
  if (dados.acessoIndevidoPossivel || dados.resultadoIncerto || (dados.repeticoes ?? 0) >= 5) return "risco_relevante";
  if (dados.dadosSensiveis || (dados.repeticoes ?? 0) >= 2) return "atencao";
  return "informativo";
}

export function prepararEventoAuditoria(evento: EventoAuditoriaSeguro) {
  const metadados = sanitizarMetadadosAuditoria(evento.metadados) as Record<string, unknown> | undefined;
  const versoes = { contrato: VERSAO_CONTRATO_AUDITORIA, politica: VERSAO_POLITICA_SEGURANCA, ...evento.versoes };
  const base = { ...evento, metadados, versoes };
  const hashIntegridade = hashReferenciaSegura(JSON.stringify(base));
  return { ...base, hashIntegridade };
}
