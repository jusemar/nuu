import type { ItemCarrinho } from "@/features/carrinho";

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
