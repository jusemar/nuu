import type { SituacaoComissao } from "../../lib/painel-comissoes/situacao-comissao";
export type LinhaComissao = {
  id: string;
  data: string;
  produto: string;
  sku: string | null;
  pedido: string;
  quantidade: number;
  vendidoCentavos: string;
  comissaoCentavos: string;
  situacao: SituacaoComissao;
  fornecedor: string;
  quitadoHistoricoCentavos: string | null;
  gestao?: { representante: string; pedidoId: string };
};
export type FiltrosPainelComissoes = {
  de?: string;
  ate?: string;
  situacao?: SituacaoComissao;
  busca?: string;
  representanteId?: string;
  fornecedorId?: string;
  pagina?: number;
};
export type ResultadoPainelComissoes = {
  gestor: boolean;
  linhas: LinhaComissao[];
  total: number;
  pagina: number;
  porPagina: number;
  totais: {
    itens: string;
    vendidoValido: string;
    comissaoValida: string;
    aReceber: string;
    invalidada: string;
    quitadaHistorica: string;
  };
};
export type DetalheComissao = {
  linha: LinhaComissao;
  precoUnitarioCentavos: string;
  descontoCentavos: string;
  regra: { tipo: "fixa" | "percentual"; valor: number; versao: string };
  eventos: { tipo: string; data: string }[];
  quitacao: {
    data: string;
    registradaEm: string;
    valorCentavos: string;
    gestao?: {
      responsavel: string;
      referencia: string | null;
      observacao: string | null;
    };
  } | null;
  gestor: boolean;
  podeQuitar: boolean;
};
