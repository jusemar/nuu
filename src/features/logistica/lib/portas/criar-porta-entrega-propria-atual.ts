import type {
  OpcaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";

export type ConsultaEntregaPropriaAtual = {
  produtoId: string;
  cep: string;
};

export type ResultadoEntregaPropriaAtual =
  | {
      disponivel: true;
      valorEmCentavos: number;
      prazoMinimoEmDiasUteis?: number | null;
      prazoMaximoEmDiasUteis?: number | null;
      descricao?: string | null;
      metadados?: Record<string, unknown> | null;
    }
  | {
      disponivel: false;
      motivo?: string | null;
    };

export type DependenciasPortaEntregaPropriaAtual = {
  consultarEntregaPropriaAtual: (
    consulta: ConsultaEntregaPropriaAtual,
  ) => Promise<ResultadoEntregaPropriaAtual>;
};

export type PortaEntregaPropriaAtual = (
  solicitacao: SolicitacaoCotacaoFrete,
) => Promise<OpcaoFrete[]>;

export function criarPortaEntregaPropriaAtual(
  dependencias: DependenciasPortaEntregaPropriaAtual,
): PortaEntregaPropriaAtual {
  return async (solicitacao) => {
    if (solicitacao.itens.length !== 1) {
      return [];
    }

    const item = solicitacao.itens[0];
    const resultado = await dependencias.consultarEntregaPropriaAtual({
      produtoId: item.produtoId,
      cep: solicitacao.destino.cep,
    });

    if (!resultado.disponivel) {
      return [];
    }

    return [
      {
        identificador: `entrega-propria:${item.produtoId}:${solicitacao.destino.cep}`,
        provedor: "entrega-propria",
        servico: "entrega-propria-atual",
        nome: "Entrega Propria",
        tipo: "entrega",
        valorEmCentavos: resultado.valorEmCentavos,
        prazoMinimoEmDiasUteis: resultado.prazoMinimoEmDiasUteis ?? null,
        prazoMaximoEmDiasUteis: resultado.prazoMaximoEmDiasUteis ?? null,
        descricao: resultado.descricao ?? null,
        metadados: {
          origem: "fluxo-atual",
          produtoId: item.produtoId,
          ...resultado.metadados,
        },
      },
    ];
  };
}
