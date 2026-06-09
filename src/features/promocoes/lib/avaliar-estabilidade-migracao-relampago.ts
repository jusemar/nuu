import type { StatusEstabilidadeMigracaoRelampago } from "../types";

export type EntradaAvaliacaoEstabilidadeMigracaoRelampago = {
  precoCalculadoEncontrado: boolean;
  oficialAtiva: boolean;
  regraOficialAplicadaId: string | null;
  regraMigradaId: string | null;
  modalidadeOficial: string | null;
  modalidadeMigrada: string;
  precoOficialEmCentavos: number | null;
  precoLegadoEmCentavos: number | null;
  countdownOficialIso: string | null;
  countdownLegadoIso: string | null;
  legadoUsado: boolean;
  stockSemPromocao: boolean | null;
};

export type ResultadoAvaliacaoEstabilidadeMigracaoRelampago = {
  status: StatusEstabilidadeMigracaoRelampago;
  motivos: string[];
};

function resolverStatusEstabilidade({
  motivosInstabilidade,
  motivosRevisao,
}: {
  motivosInstabilidade: string[];
  motivosRevisao: string[];
}): StatusEstabilidadeMigracaoRelampago {
  if (motivosInstabilidade.length > 0) return "instavel";
  if (motivosRevisao.length > 0) return "precisa_revisao";

  return "estavel";
}

export function avaliarEstabilidadeMigracaoRelampago({
  precoCalculadoEncontrado,
  oficialAtiva,
  regraOficialAplicadaId,
  regraMigradaId,
  modalidadeOficial,
  modalidadeMigrada,
  precoOficialEmCentavos,
  precoLegadoEmCentavos,
  countdownOficialIso,
  countdownLegadoIso,
  legadoUsado,
  stockSemPromocao,
}: EntradaAvaliacaoEstabilidadeMigracaoRelampago): ResultadoAvaliacaoEstabilidadeMigracaoRelampago {
  const motivosInstabilidade: string[] = [];
  const motivosRevisao: string[] = [];

  if (!precoCalculadoEncontrado) {
    motivosInstabilidade.push("Preço migrado não encontrado na vitrine.");
  }

  if (!oficialAtiva) {
    motivosInstabilidade.push("Campanha oficial ausente ou inativa.");
  }

  if (regraOficialAplicadaId !== regraMigradaId) {
    motivosInstabilidade.push("Regra oficial aplicada diverge da migração.");
  }

  if (modalidadeOficial !== modalidadeMigrada) {
    motivosInstabilidade.push("Modalidade oficial diverge do legado migrado.");
  }

  if (precoOficialEmCentavos !== precoLegadoEmCentavos) {
    motivosInstabilidade.push("Preço promocional oficial diverge do legado.");
  }

  if (countdownOficialIso !== countdownLegadoIso) {
    motivosInstabilidade.push("Countdown oficial diverge do legado.");
  }

  if (legadoUsado) {
    motivosInstabilidade.push("Fallback legado ainda está sendo usado.");
  }

  if (stockSemPromocao === false) {
    motivosInstabilidade.push("Modalidade stock recebeu promoção indevida.");
  }

  if (stockSemPromocao === null && modalidadeMigrada !== "stock") {
    motivosRevisao.push("Modalidade stock não encontrada para comparação.");
  }

  const motivos = [...motivosInstabilidade, ...motivosRevisao];

  return {
    status: resolverStatusEstabilidade({
      motivosInstabilidade,
      motivosRevisao,
    }),
    motivos:
      motivos.length > 0
        ? motivos
        : ["Migração relâmpago estável e sem uso do fallback legado."],
  };
}
