import type { ItemCarrinho } from "@/features/carrinho";
import type { ParcelamentoCartaoCalculado } from "@/features/precificacao";

export type OpcaoFreteCheckoutId = "retirada" | "padrao" | "expresso";

export type OpcaoFreteCheckout = {
  id: OpcaoFreteCheckoutId;
  nome: string;
  prazo: string;
  valorEmCentavos: number;
};

export type DadosIdentificacaoCheckout = {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
};

export type DadosEnderecoCheckout = {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacao?: string;
};

export type DadosCheckoutVisitante = DadosIdentificacaoCheckout &
  DadosEnderecoCheckout & {
    cupom?: string;
    freteId: OpcaoFreteCheckoutId;
    formaPagamento: "pix" | "cartao";
    parcelasCartao?: number;
    itens: ItemCarrinho[];
  };

export type TotaisCheckout = {
  subtotalEmCentavos: number;
  freteEmCentavos: number;
  descontoEmCentavos: number;
  totalEmCentavos: number;
};

export type ItemResumoCheckout = {
  id: string;
  produtoId: string;
  nome: string;
  imagemUrl: string;
  quantidade: number;
  modalidade: string;
  prazoModalidade: string;
  modalidadeDetalhes: {
    tipo: string;
    titulo: string;
    badge: string;
    badgeBg: string;
    badgeColor: string;
    icone: string;
    precoBaseEmCentavos: number;
    precoBase: string;
    possuiPromocao: boolean;
    precoPromocionalEmCentavos: number | null;
    precoPromocional: string | null;
    tipoPromocao: string | null;
    promocaoTerminaEm: Date | null;
    duracaoPromocao: number | null;
    unidadeDuracaoPromocao: string | null;
    precoPrincipal: boolean;
    ativo: boolean;
    garantia: string;
    origemEnvio: string;
  };
  frete: {
    id: string;
    nome: string;
    prazo: string;
    valorEmCentavos: number;
    cep?: string;
  };
  pix: {
    ativo: boolean;
    valorEmCentavos: number;
    valor: string;
  };
  cartao: {
    ativo: boolean;
    valorEmCentavos: number;
    valor: string;
    parcelamentos: ParcelamentoCartaoCalculado[];
  };
};

export type ResumoCheckoutCalculado = {
  itens: ItemResumoCheckout[];
  pagamentos: {
    pix: {
      ativo: boolean;
      totalEmCentavos: number;
      total: string;
      economiaEmCentavos: number;
    };
    cartao: {
      ativo: boolean;
      totalEmCentavos: number;
      total: string;
      parcelamentos: ParcelamentoCartaoCalculado[];
    };
  };
  totaisPorFormaPagamento: {
    pix: TotaisCheckout;
    cartao: TotaisCheckout;
  };
};
