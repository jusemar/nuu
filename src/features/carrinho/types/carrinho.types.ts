export type ItemCarrinho = {
  id: string;
  produtoId: string;
  produtoVarianteId?: string;
  produtoSlug?: string;
  produtoUrl?: string;
  nome: string;
  sku?: string | null;
  modalidadeTipo?: string;
  modalidadeTitulo?: string;
  variante?: string;
  atributosVariante?: Record<string, string>;
  prazoModalidade?: string;
  estoqueDisponivel?: number | null;
  pesoEmGramas?: number | null;
  alturaEmCm?: number | null;
  larguraEmCm?: number | null;
  comprimentoEmCm?: number | null;
  freteEscolhido?: {
    id: "retirada" | "entrega-propria" | "frenet";
    nome: string;
    prazo: string;
    valorEmCentavos: number;
    cep?: string;
    servico?: string;
    transportadora?: string;
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
