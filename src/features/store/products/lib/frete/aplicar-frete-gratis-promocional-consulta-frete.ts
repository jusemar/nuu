import "server-only";

import {
  montarCodigoServicoPromocional,
  montarCodigoTransportadoraPromocional,
} from "@/features/promocoes/lib/codigos-frete-promocional";
import { resolverRegioesPromocionaisEntrega } from "@/features/promocoes/queries/resolver-regioes-promocionais-entrega";
import { calcularFreteGratisProgressivo } from "@/features/promocoes/services";

import type {
  ConsultaFreteResult,
  OpcaoEntregaCotada,
} from "../../types/consulta-frete.types";

type EntradaAplicarFreteGratisPromocionalConsultaFrete = {
  resultado: ConsultaFreteResult;
  categoriaId: string;
  subtotalEmCentavos: number;
  cep: string;
  modalidadeComercial?: string | null;
};

function montarCodigosFreteOpcao(opcao: OpcaoEntregaCotada) {
  return [
    montarCodigoTransportadoraPromocional({
      provedor: opcao.provedor,
      transportadora: opcao.transportadora,
    }),
    montarCodigoServicoPromocional({
      provedor: opcao.provedor,
      servico: opcao.servico,
    }),
  ].filter((codigo): codigo is string => Boolean(codigo));
}

function montarFormaEntregaPromocional(opcao: OpcaoEntregaCotada) {
  if (opcao.provedor === "entrega-propria") return "entrega-propria";
  if (opcao.provedor === "retirada") return "retirada";
  return "frete-externo";
}

async function aplicarFreteGratisNaOpcao({
  opcao,
  categoriaId,
  subtotalEmCentavos,
  regioesEntregaCodigos,
  modalidadeComercial,
}: {
  opcao: OpcaoEntregaCotada;
  categoriaId: string;
  subtotalEmCentavos: number;
  regioesEntregaCodigos: string[];
  modalidadeComercial?: string | null;
}): Promise<OpcaoEntregaCotada> {
  const freteGratis = await calcularFreteGratisProgressivo({
    subtotalEmCentavos,
    modalidades: modalidadeComercial ? [modalidadeComercial] : [],
    formasEntrega: [montarFormaEntregaPromocional(opcao)],
    categoriasIds: [categoriaId],
    regioesEntregaCodigos,
    fretesSelecionadosCodigos: montarCodigosFreteOpcao(opcao),
  });

  if (!freteGratis.freteGratisAtingido || opcao.valorEmCentavos <= 0) {
    return opcao;
  }

  return {
    ...opcao,
    valorOriginalEmCentavos: opcao.valorEmCentavos,
    valorEmCentavos: 0,
    freteGratisPromocionalAplicado: true,
    regraFreteGratisAplicadaId: freteGratis.regraFreteGratisAplicada?.id,
  };
}

export async function aplicarFreteGratisPromocionalConsultaFrete({
  resultado,
  categoriaId,
  subtotalEmCentavos,
  cep,
  modalidadeComercial,
}: EntradaAplicarFreteGratisPromocionalConsultaFrete): Promise<ConsultaFreteResult> {
  const regioesEntregaCodigos = await resolverRegioesPromocionaisEntrega({
    cep,
    cidade: resultado.endereco?.cidade,
    estado: resultado.endereco?.uf,
  });
  const opcoesEntrega = await Promise.all(
    (resultado.opcoesEntrega ?? []).map((opcao) =>
      aplicarFreteGratisNaOpcao({
        opcao,
        categoriaId,
        subtotalEmCentavos,
        regioesEntregaCodigos,
        modalidadeComercial,
      }),
    ),
  );

  if (!resultado.found) {
    return {
      ...resultado,
      opcoesEntrega,
    };
  }

  const opcaoEntregaPropria = opcoesEntrega.find(
    (opcao) => opcao.provedor === "entrega-propria",
  );

  if (!opcaoEntregaPropria?.freteGratisPromocionalAplicado) {
    return {
      ...resultado,
      opcoesEntrega,
    };
  }

  return {
    ...resultado,
    shippingPriceOriginal:
      opcaoEntregaPropria.valorOriginalEmCentavos ?? resultado.shippingPrice,
    shippingPrice: opcaoEntregaPropria.valorEmCentavos,
    freteGratisPromocionalAplicado: true,
    regraFreteGratisAplicadaId: opcaoEntregaPropria.regraFreteGratisAplicadaId,
    opcoesEntrega,
  };
}
