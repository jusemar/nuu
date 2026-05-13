import type { OpcaoFreteCheckout } from "../types/checkout.types";

export const OPCOES_FRETE_CHECKOUT: OpcaoFreteCheckout[] = [
  {
    id: "padrao",
    nome: "Entrega padrão",
    prazo: "3 a 7 dias úteis",
    valorEmCentavos: 1990,
  },
  {
    id: "expresso",
    nome: "Entrega expressa",
    prazo: "1 a 3 dias úteis",
    valorEmCentavos: 3990,
  },
  {
    id: "retirada",
    nome: "Retirada na loja",
    prazo: "Após confirmação do pagamento",
    valorEmCentavos: 0,
  },
];

export const CUPONS_CHECKOUT = {
  PRIMEIRA10: {
    codigo: "PRIMEIRA10",
    percentual: 10,
    freteGratis: false,
  },
  BEMVINDO5: {
    codigo: "BEMVINDO5",
    percentual: 5,
    freteGratis: false,
  },
  FRETEGRATIS: {
    codigo: "FRETEGRATIS",
    percentual: 0,
    freteGratis: true,
  },
} as const;
