"use server";

import {
  consultarEntregaPropriaLoja,
  cotarFreteFluxoAtual,
} from "@/features/logistica";
import { buscarDisponibilidadeFreteProduto } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-produto";
import { adaptarCotacaoDisponivelParaConsultaFrete } from "../lib/frete/adaptar-cotacao-disponivel-para-consulta-frete";
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
) {
  const dadosCotacao = await buscarDadosCotacaoFreteLoja(produtoId, varianteId);

  return dadosCotacao
    ? {
        ...dadosCotacao,
        quantidade: 1,
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
): Promise<ConsultaFreteResult> {
  try {
    const entrada = await buscarEntradaCotacaoFreteLoja(
      produtoId,
      cep,
      varianteId,
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

    return adaptarCotacaoDisponivelParaConsultaFrete(
      resultado,
      disponibilidade,
    );
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
): Promise<ConsultaFreteResult> {
  return consultarFreteOficial(productId, cep, varianteId);
}
