import type {
  OpcaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";

export type RetiradaAtualDisponivel = {
  identificador: string;
  nome: string;
  descricao?: string | null;
};

export type DependenciasPortaRetiradaAtual = {
  listarRetiradasAtuais: (
    solicitacao: SolicitacaoCotacaoFrete,
  ) => Promise<RetiradaAtualDisponivel[]>;
};

export type PortaRetiradaAtual = (
  solicitacao: SolicitacaoCotacaoFrete,
) => Promise<OpcaoFrete[]>;

export function criarPortaRetiradaAtual(
  dependencias: DependenciasPortaRetiradaAtual,
): PortaRetiradaAtual {
  return async (solicitacao) => {
    const retiradas = await dependencias.listarRetiradasAtuais(solicitacao);

    return retiradas.map((retirada) => ({
      identificador: `retirada:${retirada.identificador}`,
      provedor: "retirada",
      servico: "retirada-atual",
      nome: retirada.nome,
      tipo: "retirada",
      valorEmCentavos: 0,
      descricao: retirada.descricao ?? null,
      metadados: {
        origem: "fluxo-atual",
        identificadorRetirada: retirada.identificador,
      },
    }));
  };
}
