export type ItemCarrinho = {
  id: string;
  produtoId: string;
  nome: string;
  variante?: string;
  prazoModalidade?: string;
  freteEscolhido?: {
    id: "retirada" | "entrega-propria" | "padrao";
    nome: string;
    prazo: string;
    valorEmCentavos: number;
    cep?: string;
  };
  imagemUrl: string;
  precoEmCentavos: number;
  quantidade: number;
};

export type NovoItemCarrinho = Omit<ItemCarrinho, "id" | "quantidade"> & {
  quantidade?: number;
};

export type TotaisCarrinho = {
  quantidadeTotal: number;
  subtotalEmCentavos: number;
};
