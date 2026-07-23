"use server";

import {
  consultarEntregaPropriaLoja,
  cotarFreteFluxoAtual,
} from "@/features/logistica";
import { buscarDisponibilidadeFreteProduto } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-produto";

import { adaptarCotacaoDisponivelParaConsultaFrete } from "../lib/frete/adaptar-cotacao-disponivel-para-consulta-frete";
import { aplicarFreteGratisPromocionalConsultaFrete } from "../lib/frete/aplicar-frete-gratis-promocional-consulta-frete";
import { buscarDadosCotacaoFreteLoja } from "../queries/frete/buscar-dados-cotacao-frete-loja";
import type { ConsultaFreteResult } from "../types/consulta-frete.types";

export type {
  ConsultaFreteFalha,
  ConsultaFreteResult,
  ConsultaFreteSucesso,
} from "../types/consulta-frete.types";

async function buscarEntradaCotacaoFreteLoja(
  produtoId: string,
  cep: string,
  varianteId?: string | null,
  quantidade = 1,
) {
  const dadosCotacao = await buscarDadosCotacaoFreteLoja(produtoId, varianteId);

  return dadosCotacao
    ? {
        ...dadosCotacao,
        quantidade,
        cep,
      }
    : null;
}

function criarConsultaEntregaPropriaLojaParaCotacao(
  produtoId: string,
  cep: string,
) {
  return async () => {
    const resultado = await consultarEntregaPropriaLoja({ produtoId, cep });

    if (!resultado.disponivel) {
      return {
        disponivel: false as const,
        motivo: resultado.mensagem,
      };
    }

    return {
      disponivel: true as const,
      valorEmCentavos: resultado.valorEmCentavos,
      descricao: resultado.descricao,
      metadados: {
        nivelEntregaPropriaAtual: resultado.nivel,
        prazoEntregaPropriaAtual: resultado.prazoEntrega ?? null,
        promessaEntregaPropria: resultado.promessaEntrega ?? null,
        regiaoEntregaPropria: resultado.regiaoResolvida ?? null,
        bairro: resultado.bairro,
        cidade: resultado.cidade,
        uf: resultado.uf,
        endereco: resultado.endereco,
      },
    };
  };
}

async function consultarFreteOficial(
  produtoId: string,
  cep: string,
  varianteId?: string | null,
  quantidade = 1,
  modalidadeComercial?: string | null,
): Promise<ConsultaFreteResult> {
  try {
    const entrada = await buscarEntradaCotacaoFreteLoja(
      produtoId,
      cep,
      varianteId,
      quantidade,
    );

    if (!entrada) {
      return {
        found: false,
        message: "Consulte o vendedor",
      };
    }

    const resultado = await cotarFreteFluxoAtual({
      ...entrada,
      consultarEntregaPropriaAtual: criarConsultaEntregaPropriaLojaParaCotacao(
        produtoId,
        cep,
      ),
    });

    const disponibilidade = await buscarDisponibilidadeFreteProduto({
      produtoId,
      varianteId: entrada.varianteAtual?.identificadorVariante ?? null,
      categoriaId: entrada.categoriaId,
    });

    const resultadoConsultaFrete = adaptarCotacaoDisponivelParaConsultaFrete(
      resultado,
      disponibilidade,
    );

    return aplicarFreteGratisPromocionalConsultaFrete({
      resultado: resultadoConsultaFrete,
      categoriaId: entrada.categoriaId,
      subtotalEmCentavos: Math.max(
        (entrada.valorDeclaradoEmCentavos ?? 0) * quantidade,
        0,
      ),
      cep,
      modalidadeComercial,
    });
  } catch {
    return {
      found: false,
      message: "Consulte o vendedor",
    };
  }
}

export async function consultarFreteAction(
  productId: string,
  cep: string,
  varianteId?: string | null,
  quantidade = 1,
  modalidadeComercial?: string | null,
): Promise<ConsultaFreteResult> {
  return consultarFreteOficial(
    productId,
    cep,
    varianteId,
    quantidade,
    modalidadeComercial,
  );
}
