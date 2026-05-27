export type DimensoesPacote = {
  alturaEmCm: number;
  larguraEmCm: number;
  comprimentoEmCm: number;
};

export type EnderecoEntrega = {
  cep: string;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais: "BR";
};

export type ItemLogistico = {
  identificador: string;
  produtoId: string;
  varianteId?: string | null;
  nome: string;
  codigoSku?: string | null;
  quantidade: number;
  pesoEmGramas: number;
  dimensoes: DimensoesPacote;
  valorDeclaradoEmCentavos?: number | null;
};

export type PacoteEnvio = {
  identificador: string;
  itens: ItemLogistico[];
  quantidadeVolumes: number;
  pesoTotalEmGramas: number;
  dimensoes: DimensoesPacote;
};

export type SolicitacaoCotacaoFrete = {
  identificador: string;
  destino: EnderecoEntrega;
  itens: ItemLogistico[];
  pacotes: PacoteEnvio[];
  moeda: "BRL";
};

export type OpcaoFrete = {
  identificador: string;
  provedor: string;
  servico: string;
  nome: string;
  tipo: "entrega" | "retirada";
  valorEmCentavos: number;
  prazoMinimoEmDiasUteis?: number | null;
  prazoMaximoEmDiasUteis?: number | null;
  descricao?: string | null;
  metadados?: Record<string, unknown> | null;
};

export type SelecaoFrete = {
  identificador: string;
  identificadorCotacao: string;
  opcao: OpcaoFrete;
  destino: EnderecoEntrega;
  pacotes: PacoteEnvio[];
  selecionadaEm: Date;
};

export type ErroCotacaoFrete = {
  codigo: string;
  mensagem: string;
  provedor?: string | null;
};

export type ResultadoCotacaoFrete =
  | {
      sucesso: true;
      solicitacao: SolicitacaoCotacaoFrete;
      opcoes: OpcaoFrete[];
      avisos: string[];
    }
  | {
      sucesso: false;
      solicitacao: SolicitacaoCotacaoFrete;
      opcoes: OpcaoFrete[];
      erros: ErroCotacaoFrete[];
    };

export interface ProvedorFrete {
  identificador: string;
  nome: string;
  ativo: boolean;
  cotarFrete(
    solicitacao: SolicitacaoCotacaoFrete,
  ): Promise<ResultadoCotacaoFrete>;
}
