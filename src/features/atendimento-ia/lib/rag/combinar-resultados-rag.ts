import { PADROES_INSTRUCAO_NAO_EXECUTAVEL_RAG } from "../../constants/rag";
import type { CandidatoRag, FonteRagSelecionada } from "../../types/rag";

function limitar(valor: number) {
  return Math.max(0, Math.min(1, Number.isFinite(valor) ? valor : 0));
}

function normalizar(valores: number[]) {
  // Similaridade cosseno e rank textual são projetados para a escala [0, 1].
  // O clamp explícito impede que outliers tornem as duas escalas incompatíveis.
  return valores.map(limitar);
}

function similaridadeLexica(a: string, b: string) {
  const termos = (texto: string) =>
    new Set(texto.toLocaleLowerCase("pt-BR").match(/[\p{L}\p{N}]{3,}/gu) ?? []);
  const termosA = termos(a);
  const termosB = termos(b);
  const intersecao = [...termosA].filter((termo) => termosB.has(termo)).length;
  return intersecao / Math.max(1, Math.min(termosA.size, termosB.size));
}

const PADRAO_NEGACAO = /\b(?:não|nunca|proibido|vedado)\b/iu;

export function conteudoInstitucionalContemInstrucaoMaliciosa(conteudo: string) {
  return PADROES_INSTRUCAO_NAO_EXECUTAVEL_RAG.some((padrao) => padrao.test(conteudo));
}

export function combinarResultadosRag(
  candidatos: CandidatoRag[],
  configuracao: {
    limiteCandidatos: number;
    limiteResultados: number;
    pesoSemantico: number;
    pesoTextual: number;
    relevanciaMinima: number;
  },
): FonteRagSelecionada[] {
  const ordenadosEntrada = [...candidatos]
    .sort((a, b) => a.fragmentoId.localeCompare(b.fragmentoId))
    .slice(0, configuracao.limiteCandidatos);
  const semanticas = normalizar(ordenadosEntrada.map((item) => item.pontuacaoSemantica));
  const textuais = normalizar(ordenadosEntrada.map((item) => item.pontuacaoTextual));
  const pontuados = ordenadosEntrada.map((item, indice) => ({
    ...item,
    pontuacaoFinal: limitar(
      semanticas[indice]! * configuracao.pesoSemantico +
        textuais[indice]! * configuracao.pesoTextual,
    ),
  }));
  const selecionados: FonteRagSelecionada[] = [];
  for (const candidato of pontuados.sort(
    (a, b) => b.pontuacaoFinal - a.pontuacaoFinal || a.fragmentoId.localeCompare(b.fragmentoId),
  )) {
    if (candidato.pontuacaoFinal < configuracao.relevanciaMinima) continue;
    if (
      selecionados.some(
        (existente) =>
          existente.hashConteudo === candidato.hashConteudo ||
          (similaridadeLexica(existente.conteudo, candidato.conteudo) >= 0.9 &&
            PADRAO_NEGACAO.test(existente.conteudo) ===
              PADRAO_NEGACAO.test(candidato.conteudo)),
      )
    ) {
      continue;
    }
    selecionados.push(candidato);
    if (selecionados.length >= configuracao.limiteResultados) break;
  }
  return selecionados;
}

export function detectarConflitoFontes(fontes: FonteRagSelecionada[]) {
  return fontes.some((fonte, indice) =>
    fontes.slice(indice + 1).some(
      (outra) =>
        fonte.documentoId !== outra.documentoId &&
        similaridadeLexica(fonte.conteudo, outra.conteudo) >= 0.45 &&
        PADRAO_NEGACAO.test(fonte.conteudo) !== PADRAO_NEGACAO.test(outra.conteudo),
    ),
  );
}
