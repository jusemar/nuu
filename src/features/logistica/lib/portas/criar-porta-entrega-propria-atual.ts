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
      opcoesAdicionais?: Array<{
        servico: string;
        nome: string;
        valorEmCentavos: number;
        descricao?: string | null;
        metadados?: Record<string, unknown> | null;
      }>;
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

    const opcaoRapida: OpcaoFrete = {
        identificador: `entrega-propria:${item.produtoId}:${solicitacao.destino.cep}`,
        provedor: "entrega-propria",
        servico: "entrega-propria-atual",
        nome: "Entrega rápida",
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
      };

    const adicionais = (resultado.opcoesAdicionais ?? []).map((opcao) => ({
      identificador: `entrega-propria:${opcao.servico}:${item.produtoId}:${solicitacao.destino.cep}`,
      provedor: "entrega-propria",
      servico: opcao.servico,
      nome: opcao.nome,
      tipo: "entrega" as const,
      valorEmCentavos: opcao.valorEmCentavos,
      descricao: opcao.descricao ?? null,
      metadados: {
        origem: "fluxo-atual",
        produtoId: item.produtoId,
        ...opcao.metadados,
      },
    }));

    return [opcaoRapida, ...adicionais];
  };
}
