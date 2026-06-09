"use server";

import type { ItemCarrinho } from "@/features/carrinho";
import {
  calcularFreteGratisProgressivo,
  validarCupomPromocao,
  type ResultadoFreteGratisProgressivo,
  type ResultadoValidarCupomPromocao,
} from "@/features/promocoes/services";
import { extrairCodigosFretePromocionalDeItens } from "@/features/promocoes/lib/codigos-frete-promocional";

import { calcularResumoCheckout } from "../resumo-checkout/calcular-resumo-checkout";
import type {
  ResumoCheckoutCalculado,
  TotaisCheckout,
} from "../../types/checkout.types";

type FormaPagamentoPrevia = "pix" | "cartao";

type EntradaCalcularPreviaTotaisPedido = {
  itens: ItemCarrinho[];
  codigoCupom?: string | null;
  clienteId?: string | null;
  freteEmCentavosOficial?: number | null;
  aplicarFreteGratisPromocional?: boolean;
  cepEntrega?: string | null;
  cidadeEntrega?: string | null;
  estadoEntrega?: string | null;
  regioesEntregaCodigos?: string[];
  fretesSelecionadosCodigos?: string[];
};

export type ResultadoFreteGratisPromocionalPedido = {
  elegivel: boolean;
  freteGratisPromocionalAplicado: boolean;
  valorFreteOriginalEmCentavos: number;
  valorFreteFinalEmCentavos: number;
  descontoFretePromocionalEmCentavos: number;
  regraFreteGratisAplicada: ResultadoFreteGratisProgressivo["regraFreteGratisAplicada"];
  modalidadeAplicada: string | null;
  modalidadesElegiveis: string[];
  regiaoAplicada: string | null;
  regioesElegiveis: string[];
  transportadoraAplicada: string | null;
  servicoAplicado: string | null;
  fretesSelecionadosElegiveis: string[];
  tipoPrioridadeFreteGratis: ResultadoFreteGratisProgressivo["tipoPrioridade"];
  regrasIgnoradasPorPrecedencia: ResultadoFreteGratisProgressivo["regrasIgnoradasPorPrecedencia"];
};

export type TotalPreviaFormaPagamento = TotaisCheckout & {
  descontoPromocionalEmCentavos: number;
  descontoCupomEmCentavos: number;
  descontoFretePromocionalEmCentavos: number;
  economiaEmCentavos: number;
  totalEstimadoEmCentavos: number;
  freteGratisPromocionalAplicado: boolean;
  valorFreteOriginalEmCentavos: number;
  valorFreteFinalEmCentavos: number;
  regraFreteGratisAplicada: ResultadoFreteGratisProgressivo["regraFreteGratisAplicada"];
  modalidadeAplicada: string | null;
  modalidadesElegiveis: string[];
  regiaoAplicada: string | null;
  regioesElegiveis: string[];
  transportadoraAplicada: string | null;
  servicoAplicado: string | null;
  fretesSelecionadosElegiveis: string[];
  tipoPrioridadeFreteGratis: ResultadoFreteGratisProgressivo["tipoPrioridade"];
  regrasIgnoradasPorPrecedencia: ResultadoFreteGratisProgressivo["regrasIgnoradasPorPrecedencia"];
};

export type ResultadoCalcularPreviaTotaisPedido = {
  sucesso: true;
  cupom: ResultadoValidarCupomPromocao | null;
  freteGratisProgressivo: ResultadoFreteGratisProgressivo;
  freteGratisAtingido: boolean;
  freteGratisSubtotalMeta: number | null;
  freteGratisFaltante: number;
  regraFreteGratisAplicada: ResultadoFreteGratisProgressivo["regraFreteGratisAplicada"];
  freteGratisPromocional: ResultadoFreteGratisPromocionalPedido;
  freteGratisPromocionalAplicado: boolean;
  valorFreteOriginalEmCentavos: number;
  valorFreteFinalEmCentavos: number;
  modalidadeFreteGratisAplicada: string | null;
  modalidadesFreteGratisElegiveis: string[];
  regiaoFreteGratisAplicada: string | null;
  regioesFreteGratisElegiveis: string[];
  transportadoraFreteGratisAplicada: string | null;
  servicoFreteGratisAplicado: string | null;
  fretesSelecionadosFreteGratisElegiveis: string[];
  tipoPrioridadeFreteGratis: ResultadoFreteGratisProgressivo["tipoPrioridade"];
  regrasIgnoradasPorPrecedenciaFreteGratis: ResultadoFreteGratisProgressivo["regrasIgnoradasPorPrecedencia"];
  totaisPorFormaPagamento: Record<
    FormaPagamentoPrevia,
    TotalPreviaFormaPagamento
  >;
};

function criarCupomAusente(): ResultadoValidarCupomPromocao | null {
  return null;
}

async function validarCupomPorSubtotal({
  codigoCupom,
  subtotalEmCentavos,
  clienteId,
}: {
  codigoCupom?: string | null;
  subtotalEmCentavos: number;
  clienteId?: string | null;
}) {
  if (!codigoCupom?.trim()) {
    return criarCupomAusente();
  }

  return validarCupomPromocao({
    codigoCupom,
    subtotalEmCentavos,
    clienteId,
  });
}

function aplicarCupomNaFormaPagamento({
  totais,
  cupom,
  descontoPromocionalEmCentavos,
  freteGratisPromocional,
}: {
  totais: TotaisCheckout;
  cupom: ResultadoValidarCupomPromocao | null;
  descontoPromocionalEmCentavos: number;
  freteGratisPromocional: ResultadoFreteGratisPromocionalPedido;
}): TotalPreviaFormaPagamento {
  const descontoCupomEmCentavos = cupom?.valido
    ? cupom.descontoEstimadoEmCentavos
    : 0;
  const totalEstimadoEmCentavos = Math.max(
    totais.totalEmCentavos - descontoCupomEmCentavos,
    0,
  );

  return {
    ...totais,
    descontoPromocionalEmCentavos,
    descontoCupomEmCentavos,
    descontoFretePromocionalEmCentavos:
      freteGratisPromocional.descontoFretePromocionalEmCentavos,
    economiaEmCentavos:
      descontoCupomEmCentavos +
      freteGratisPromocional.descontoFretePromocionalEmCentavos,
    totalEstimadoEmCentavos,
    freteGratisPromocionalAplicado:
      freteGratisPromocional.freteGratisPromocionalAplicado,
    valorFreteOriginalEmCentavos:
      freteGratisPromocional.valorFreteOriginalEmCentavos,
    valorFreteFinalEmCentavos: freteGratisPromocional.valorFreteFinalEmCentavos,
    regraFreteGratisAplicada: freteGratisPromocional.regraFreteGratisAplicada,
    modalidadeAplicada: freteGratisPromocional.modalidadeAplicada,
    modalidadesElegiveis: freteGratisPromocional.modalidadesElegiveis,
    regiaoAplicada: freteGratisPromocional.regiaoAplicada,
    regioesElegiveis: freteGratisPromocional.regioesElegiveis,
    transportadoraAplicada: freteGratisPromocional.transportadoraAplicada,
    servicoAplicado: freteGratisPromocional.servicoAplicado,
    fretesSelecionadosElegiveis:
      freteGratisPromocional.fretesSelecionadosElegiveis,
    tipoPrioridadeFreteGratis: freteGratisPromocional.tipoPrioridadeFreteGratis,
    regrasIgnoradasPorPrecedencia:
      freteGratisPromocional.regrasIgnoradasPorPrecedencia,
  };
}

function aplicarFreteOficialNaFormaPagamento({
  totais,
  freteEmCentavosOficial,
}: {
  totais: TotaisCheckout;
  freteEmCentavosOficial?: number | null;
}): TotaisCheckout {
  if (typeof freteEmCentavosOficial !== "number") {
    return totais;
  }

  const diferencaFrete = freteEmCentavosOficial - totais.freteEmCentavos;

  return {
    ...totais,
    freteEmCentavos: freteEmCentavosOficial,
    totalEmCentavos: Math.max(totais.totalEmCentavos + diferencaFrete, 0),
  };
}

function calcularDescontoPromocionalPorResumo({
  resumo,
}: {
  resumo: ResumoCheckoutCalculado;
}) {
  return resumo.itens.reduce((total, item) => {
    const precoOriginal = item.modalidadeDetalhes.precoBaseEmCentavos;
    const precoFinalPromocional = item.cartao.valorEmCentavos;
    const descontoUnitario = Math.max(precoOriginal - precoFinalPromocional, 0);

    return total + descontoUnitario * item.quantidade;
  }, 0);
}

export async function calcularSubtotalElegibilidadeFreteGratisPromocional({
  subtotalEmCentavos,
  descontoCupomEmCentavos,
}: {
  subtotalEmCentavos: number;
  descontoCupomEmCentavos: number;
}) {
  return Math.max(subtotalEmCentavos - descontoCupomEmCentavos, 0);
}

export async function calcularFreteGratisPromocionalPedido({
  totais,
  freteGratisProgressivo,
  aplicarFreteGratisPromocional,
}: {
  totais: TotaisCheckout;
  freteGratisProgressivo: ResultadoFreteGratisProgressivo;
  aplicarFreteGratisPromocional: boolean;
}): ResultadoFreteGratisPromocionalPedido {
  const valorFreteOriginalEmCentavos = Math.max(totais.freteEmCentavos, 0);
  const elegivel =
    freteGratisProgressivo.freteGratisAtingido &&
    valorFreteOriginalEmCentavos > 0;
  const freteGratisPromocionalAplicado =
    aplicarFreteGratisPromocional && elegivel;
  const valorFreteFinalEmCentavos = freteGratisPromocionalAplicado
    ? 0
    : valorFreteOriginalEmCentavos;
  const descontoFretePromocionalEmCentavos = Math.max(
    valorFreteOriginalEmCentavos - valorFreteFinalEmCentavos,
    0,
  );

  return {
    elegivel,
    freteGratisPromocionalAplicado,
    valorFreteOriginalEmCentavos,
    valorFreteFinalEmCentavos,
    descontoFretePromocionalEmCentavos,
    regraFreteGratisAplicada: freteGratisProgressivo.regraFreteGratisAplicada,
    modalidadeAplicada: freteGratisProgressivo.modalidade,
    modalidadesElegiveis: freteGratisProgressivo.modalidadesElegiveis,
    regiaoAplicada: freteGratisProgressivo.regiaoCodigo,
    regioesElegiveis: freteGratisProgressivo.regioesEntregaCodigos,
    transportadoraAplicada: freteGratisProgressivo.transportadoraCodigo,
    servicoAplicado: freteGratisProgressivo.servicoCodigo,
    fretesSelecionadosElegiveis:
      freteGratisProgressivo.fretesSelecionadosCodigos,
    tipoPrioridadeFreteGratis: freteGratisProgressivo.tipoPrioridade,
    regrasIgnoradasPorPrecedencia:
      freteGratisProgressivo.regrasIgnoradasPorPrecedencia,
  };
}

function aplicarFreteGratisPromocionalNaFormaPagamento({
  totais,
  freteGratisPromocional,
}: {
  totais: TotaisCheckout;
  freteGratisPromocional: ResultadoFreteGratisPromocionalPedido;
}): TotaisCheckout {
  if (!freteGratisPromocional.freteGratisPromocionalAplicado) {
    return totais;
  }

  return {
    ...totais,
    freteEmCentavos: freteGratisPromocional.valorFreteFinalEmCentavos,
    totalEmCentavos: Math.max(
      totais.totalEmCentavos -
        freteGratisPromocional.descontoFretePromocionalEmCentavos,
      0,
    ),
  };
}

export async function calcularPreviaTotaisPedido({
  itens,
  codigoCupom,
  clienteId,
  freteEmCentavosOficial,
  aplicarFreteGratisPromocional = true,
  cepEntrega,
  cidadeEntrega,
  estadoEntrega,
  regioesEntregaCodigos,
  fretesSelecionadosCodigos,
}: EntradaCalcularPreviaTotaisPedido): Promise<ResultadoCalcularPreviaTotaisPedido | null> {
  const resumo = await calcularResumoCheckout({ itens });

  if (!resumo) {
    return null;
  }

  const cupomCartao = await validarCupomPorSubtotal({
    codigoCupom,
    subtotalEmCentavos:
      resumo.totaisPorFormaPagamento.cartao.subtotalEmCentavos,
    clienteId,
  });
  const cupomPix = await validarCupomPorSubtotal({
    codigoCupom,
    subtotalEmCentavos: resumo.totaisPorFormaPagamento.pix.subtotalEmCentavos,
    clienteId,
  });
  const totaisCartaoBase = aplicarFreteOficialNaFormaPagamento({
    totais: resumo.totaisPorFormaPagamento.cartao,
    freteEmCentavosOficial,
  });
  const totaisPixBase = aplicarFreteOficialNaFormaPagamento({
    totais: resumo.totaisPorFormaPagamento.pix,
    freteEmCentavosOficial,
  });
  const descontoPromocionalEmCentavos = calcularDescontoPromocionalPorResumo({
    resumo,
  });
  const modalidades = [
    ...new Set(itens.map((item) => item.modalidadeTipo).filter(Boolean)),
  ] as string[];
  const { resolverRegioesPromocionaisEntrega } = await import(
    "@/features/promocoes/queries/resolver-regioes-promocionais-entrega"
  );
  const codigosRegiaoEntrega =
    regioesEntregaCodigos ??
    (await resolverRegioesPromocionaisEntrega({
      cep: cepEntrega,
      cidade: cidadeEntrega,
      estado: estadoEntrega,
    }));
  const codigosFreteSelecionado =
    fretesSelecionadosCodigos ?? extrairCodigosFretePromocionalDeItens(itens);
  const descontoCupomElegibilidadeFrete = cupomCartao?.valido
    ? cupomCartao.descontoEstimadoEmCentavos
    : 0;
  const subtotalElegibilidadeFreteGratis =
    await calcularSubtotalElegibilidadeFreteGratisPromocional({
      subtotalEmCentavos: totaisCartaoBase.subtotalEmCentavos,
      descontoCupomEmCentavos: descontoCupomElegibilidadeFrete,
    });
  const freteGratisProgressivo = await calcularFreteGratisProgressivo({
    subtotalEmCentavos: subtotalElegibilidadeFreteGratis,
    modalidades,
    regioesEntregaCodigos: codigosRegiaoEntrega,
    fretesSelecionadosCodigos: codigosFreteSelecionado,
  });
  const freteGratisPromocionalCartao =
    await calcularFreteGratisPromocionalPedido({
      totais: totaisCartaoBase,
      freteGratisProgressivo,
      aplicarFreteGratisPromocional,
    });
  const freteGratisPromocionalPix = await calcularFreteGratisPromocionalPedido({
    totais: totaisPixBase,
    freteGratisProgressivo,
    aplicarFreteGratisPromocional,
  });
  const totaisCartao = aplicarCupomNaFormaPagamento({
    totais: aplicarFreteGratisPromocionalNaFormaPagamento({
      totais: totaisCartaoBase,
      freteGratisPromocional: freteGratisPromocionalCartao,
    }),
    cupom: cupomCartao,
    descontoPromocionalEmCentavos,
    freteGratisPromocional: freteGratisPromocionalCartao,
  });
  const totaisPix = aplicarCupomNaFormaPagamento({
    totais: aplicarFreteGratisPromocionalNaFormaPagamento({
      totais: totaisPixBase,
      freteGratisPromocional: freteGratisPromocionalPix,
    }),
    cupom: cupomPix,
    descontoPromocionalEmCentavos,
    freteGratisPromocional: freteGratisPromocionalPix,
  });

  return {
    sucesso: true,
    cupom: cupomCartao ?? cupomPix,
    freteGratisProgressivo,
    freteGratisAtingido: freteGratisProgressivo.freteGratisAtingido,
    freteGratisSubtotalMeta: freteGratisProgressivo.freteGratisSubtotalMeta,
    freteGratisFaltante: freteGratisProgressivo.freteGratisFaltante,
    regraFreteGratisAplicada: freteGratisProgressivo.regraFreteGratisAplicada,
    freteGratisPromocional: freteGratisPromocionalCartao,
    freteGratisPromocionalAplicado:
      freteGratisPromocionalCartao.freteGratisPromocionalAplicado,
    valorFreteOriginalEmCentavos:
      freteGratisPromocionalCartao.valorFreteOriginalEmCentavos,
    valorFreteFinalEmCentavos:
      freteGratisPromocionalCartao.valorFreteFinalEmCentavos,
    modalidadeFreteGratisAplicada:
      freteGratisPromocionalCartao.modalidadeAplicada,
    modalidadesFreteGratisElegiveis:
      freteGratisPromocionalCartao.modalidadesElegiveis,
    regiaoFreteGratisAplicada: freteGratisPromocionalCartao.regiaoAplicada,
    regioesFreteGratisElegiveis: freteGratisPromocionalCartao.regioesElegiveis,
    transportadoraFreteGratisAplicada:
      freteGratisPromocionalCartao.transportadoraAplicada,
    servicoFreteGratisAplicado: freteGratisPromocionalCartao.servicoAplicado,
    fretesSelecionadosFreteGratisElegiveis:
      freteGratisPromocionalCartao.fretesSelecionadosElegiveis,
    tipoPrioridadeFreteGratis:
      freteGratisPromocionalCartao.tipoPrioridadeFreteGratis,
    regrasIgnoradasPorPrecedenciaFreteGratis:
      freteGratisPromocionalCartao.regrasIgnoradasPorPrecedencia,
    totaisPorFormaPagamento: {
      pix: {
        ...totaisPix,
        economiaEmCentavos:
          totaisPix.descontoPromocionalEmCentavos +
          totaisPix.descontoCupomEmCentavos +
          totaisPix.descontoFretePromocionalEmCentavos +
          Math.max(
            totaisCartao.totalEstimadoEmCentavos -
              totaisPix.totalEstimadoEmCentavos,
            0,
          ),
      },
      cartao: {
        ...totaisCartao,
        economiaEmCentavos:
          totaisCartao.descontoPromocionalEmCentavos +
          totaisCartao.descontoCupomEmCentavos +
          totaisCartao.descontoFretePromocionalEmCentavos,
      },
    },
  };
}
