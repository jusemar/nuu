import { buscarPromocoesValidas } from "../queries/buscar-promocoes-validas";
import type { RegraFreteGratisPromocaoCalculavel } from "../types";

export type TipoPrioridadeFreteGratisPromocional =
  | "servico"
  | "transportadora"
  | "modalidade"
  | "regiao"
  | "global";

export type EntradaCalcularFreteGratisProgressivo = {
  subtotalEmCentavos: number;
  modalidades?: string[];
  regioesEntregaCodigos?: string[];
  fretesSelecionadosCodigos?: string[];
  dataReferencia?: Date;
  regrasFreteGratis?: RegraFreteGratisPromocaoCalculavel[];
};

export type ResultadoFreteGratisProgressivo = {
  ativo: boolean;
  atingido: boolean;
  freteGratisAtingido: boolean;
  subtotalEmCentavos: number;
  subtotalMinimoEmCentavos: number | null;
  freteGratisSubtotalMeta: number | null;
  faltanteEmCentavos: number;
  freteGratisFaltante: number;
  percentualProgresso: number;
  modalidade: string | null;
  modalidadesElegiveis: string[];
  mensagem: string | null;
  regiaoCodigo: string | null;
  regioesEntregaCodigos: string[];
  transportadoraCodigo: string | null;
  servicoCodigo: string | null;
  fretesSelecionadosCodigos: string[];
  regraFreteGratisId: string | null;
  regraPromocaoId: string | null;
  tipoPrioridade: TipoPrioridadeFreteGratisPromocional | null;
  regrasIgnoradasPorPrecedencia: Array<{
    id: string;
    regraPromocaoId: string;
    tipoPrioridade: TipoPrioridadeFreteGratisPromocional;
  }>;
  regraFreteGratisAplicada: {
    id: string;
    regraPromocaoId: string;
    modalidade: string | null;
    regiaoCodigo: string | null;
    transportadoraCodigo: string | null;
    servicoCodigo: string | null;
    tipoPrioridade: TipoPrioridadeFreteGratisPromocional;
  } | null;
};

function criarResultadoInativo(
  subtotalEmCentavos: number,
  regioesEntregaCodigos: string[] = [],
  modalidadesElegiveis: string[] = [],
  fretesSelecionadosCodigos: string[] = [],
): ResultadoFreteGratisProgressivo {
  return {
    ativo: false,
    atingido: false,
    freteGratisAtingido: false,
    subtotalEmCentavos,
    subtotalMinimoEmCentavos: null,
    freteGratisSubtotalMeta: null,
    faltanteEmCentavos: 0,
    freteGratisFaltante: 0,
    percentualProgresso: 0,
    modalidade: null,
    modalidadesElegiveis,
    mensagem: null,
    regiaoCodigo: null,
    regioesEntregaCodigos,
    transportadoraCodigo: null,
    servicoCodigo: null,
    fretesSelecionadosCodigos,
    regraFreteGratisId: null,
    regraPromocaoId: null,
    tipoPrioridade: null,
    regrasIgnoradasPorPrecedencia: [],
    regraFreteGratisAplicada: null,
  };
}

function normalizarListaCodigos(codigos: string[]) {
  return [...new Set(codigos.map((codigo) => codigo.trim()).filter(Boolean))];
}

function regraCompativelComModalidades({
  regra,
  modalidades,
}: {
  regra: RegraFreteGratisPromocaoCalculavel;
  modalidades: string[];
}) {
  if (!regra.modalidade) return true;

  return modalidades.includes(regra.modalidade);
}

function regraCompativelComRegioes({
  regra,
  regioesEntregaCodigos,
}: {
  regra: RegraFreteGratisPromocaoCalculavel;
  regioesEntregaCodigos: string[];
}) {
  if (!regra.regiaoCodigo) return true;

  return regioesEntregaCodigos.includes(regra.regiaoCodigo);
}

function regraCompativelComFreteSelecionado({
  regra,
  fretesSelecionadosCodigos,
}: {
  regra: RegraFreteGratisPromocaoCalculavel;
  fretesSelecionadosCodigos: string[];
}) {
  if (
    regra.transportadoraCodigo &&
    !fretesSelecionadosCodigos.includes(regra.transportadoraCodigo)
  ) {
    return false;
  }

  if (
    regra.servicoCodigo &&
    !fretesSelecionadosCodigos.includes(regra.servicoCodigo)
  ) {
    return false;
  }

  return true;
}

function obterTipoPrioridadeFreteGratis(
  regra: RegraFreteGratisPromocaoCalculavel,
): TipoPrioridadeFreteGratisPromocional {
  if (regra.servicoCodigo) return "servico";
  if (regra.transportadoraCodigo) return "transportadora";
  if (regra.modalidade) return "modalidade";
  if (regra.regiaoCodigo) return "regiao";

  return "global";
}

function obterPesoPrioridadeFreteGratis(
  tipoPrioridade: TipoPrioridadeFreteGratisPromocional,
) {
  const pesos: Record<TipoPrioridadeFreteGratisPromocional, number> = {
    servico: 5,
    transportadora: 4,
    modalidade: 3,
    regiao: 2,
    global: 1,
  };

  return pesos[tipoPrioridade];
}

function selecionarMetaProgressiva(
  regras: RegraFreteGratisPromocaoCalculavel[],
  subtotalEmCentavos: number,
) {
  const regrasOrdenadas = regras.sort(
    (atual, proxima) => atual.subtotalMinimo - proxima.subtotalMinimo,
  );

  return (
    regrasOrdenadas.find(
      (regra) => regra.subtotalMinimo >= subtotalEmCentavos,
    ) ?? regrasOrdenadas[regrasOrdenadas.length - 1]!
  );
}

function selecionarRegraFreteGratis({
  regras,
  subtotalEmCentavos,
  modalidades,
  regioesEntregaCodigos,
  fretesSelecionadosCodigos,
}: {
  regras: RegraFreteGratisPromocaoCalculavel[];
  subtotalEmCentavos: number;
  modalidades: string[];
  regioesEntregaCodigos: string[];
  fretesSelecionadosCodigos: string[];
}) {
  const regrasCompativeis = regras
    .filter((regra) => regra.subtotalMinimo > 0)
    .filter((regra) => regraCompativelComModalidades({ regra, modalidades }))
    .filter((regra) =>
      regraCompativelComRegioes({ regra, regioesEntregaCodigos }),
    )
    .filter((regra) =>
      regraCompativelComFreteSelecionado({
        regra,
        fretesSelecionadosCodigos,
      }),
    );

  if (regrasCompativeis.length === 0) return null;

  const maiorPeso = Math.max(
    ...regrasCompativeis.map((regra) =>
      obterPesoPrioridadeFreteGratis(obterTipoPrioridadeFreteGratis(regra)),
    ),
  );
  const regrasMaisEspecificas = regrasCompativeis.filter(
    (regra) =>
      obterPesoPrioridadeFreteGratis(obterTipoPrioridadeFreteGratis(regra)) ===
      maiorPeso,
  );
  const regra = selecionarMetaProgressiva(
    regrasMaisEspecificas,
    subtotalEmCentavos,
  );
  const regrasIgnoradasPorPrecedencia = regrasCompativeis
    .filter(
      (regraCompativel) =>
        obterPesoPrioridadeFreteGratis(
          obterTipoPrioridadeFreteGratis(regraCompativel),
        ) < maiorPeso,
    )
    .map((regraCompativel) => ({
      id: regraCompativel.id,
      regraPromocaoId: regraCompativel.regraPromocaoId,
      tipoPrioridade: obterTipoPrioridadeFreteGratis(regraCompativel),
    }));

  return {
    regra,
    tipoPrioridade: obterTipoPrioridadeFreteGratis(regra),
    regrasIgnoradasPorPrecedencia,
  };
}

export async function calcularFreteGratisProgressivo({
  subtotalEmCentavos,
  modalidades = [],
  regioesEntregaCodigos = [],
  fretesSelecionadosCodigos = [],
  dataReferencia,
  regrasFreteGratis,
}: EntradaCalcularFreteGratisProgressivo): Promise<ResultadoFreteGratisProgressivo> {
  const subtotalSeguro = Math.max(subtotalEmCentavos, 0);
  const modalidadesNormalizadas = normalizarListaCodigos(modalidades);
  const codigosRegiaoNormalizados = normalizarListaCodigos(
    regioesEntregaCodigos,
  );
  const codigosFreteNormalizados = normalizarListaCodigos(
    fretesSelecionadosCodigos,
  );
  const regras =
    regrasFreteGratis ??
    (
      await buscarPromocoesValidas({
        dataReferencia,
      })
    ).fretesGratisPromocao;
  const selecao = selecionarRegraFreteGratis({
    regras,
    subtotalEmCentavos: subtotalSeguro,
    modalidades: modalidadesNormalizadas,
    regioesEntregaCodigos: codigosRegiaoNormalizados,
    fretesSelecionadosCodigos: codigosFreteNormalizados,
  });

  if (!selecao) {
    return criarResultadoInativo(
      subtotalSeguro,
      codigosRegiaoNormalizados,
      modalidadesNormalizadas,
      codigosFreteNormalizados,
    );
  }

  const { regra, tipoPrioridade, regrasIgnoradasPorPrecedencia } = selecao;
  const faltanteEmCentavos = Math.max(regra.subtotalMinimo - subtotalSeguro, 0);
  const atingido = faltanteEmCentavos === 0;
  const percentualProgresso = Math.min(
    Math.round((subtotalSeguro / regra.subtotalMinimo) * 100),
    100,
  );
  const mensagemPadrao = atingido
    ? "Frete grátis promocional atingido."
    : `Faltam ${faltanteEmCentavos} centavos para frete grátis.`;

  return {
    ativo: true,
    atingido,
    freteGratisAtingido: atingido,
    subtotalEmCentavos: subtotalSeguro,
    subtotalMinimoEmCentavos: regra.subtotalMinimo,
    freteGratisSubtotalMeta: regra.subtotalMinimo,
    faltanteEmCentavos,
    freteGratisFaltante: faltanteEmCentavos,
    percentualProgresso,
    modalidade: regra.modalidade,
    modalidadesElegiveis: modalidadesNormalizadas,
    mensagem: regra.mensagemProgressiva || mensagemPadrao,
    regiaoCodigo: regra.regiaoCodigo,
    regioesEntregaCodigos: codigosRegiaoNormalizados,
    transportadoraCodigo: regra.transportadoraCodigo,
    servicoCodigo: regra.servicoCodigo,
    fretesSelecionadosCodigos: codigosFreteNormalizados,
    regraFreteGratisId: regra.id,
    regraPromocaoId: regra.regraPromocaoId,
    tipoPrioridade,
    regrasIgnoradasPorPrecedencia,
    regraFreteGratisAplicada: {
      id: regra.id,
      regraPromocaoId: regra.regraPromocaoId,
      modalidade: regra.modalidade,
      regiaoCodigo: regra.regiaoCodigo,
      transportadoraCodigo: regra.transportadoraCodigo,
      servicoCodigo: regra.servicoCodigo,
      tipoPrioridade,
    },
  };
}
