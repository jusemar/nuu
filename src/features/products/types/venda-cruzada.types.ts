export type ProdutoVendaCruzadaAdmin = {
  id: string;
  nome: string;
  sku: string;
  tipo: "simples" | "variavel";
  imagemUrl: string | null;
  ativo: boolean;
  publicado: boolean;
  disponivel: boolean;
  precoComercialEmCentavos: number | null;
  precoPixEmCentavos: number | null;
  parcelamentoCartao: {
    parcelas: number;
    valorEmCentavos: number;
  } | null;
};

export type ConfiguracaoVendaCruzadaAdmin = {
  ativa: boolean;
  produtoPrincipal: ProdutoVendaCruzadaAdmin;
  produtos: ProdutoVendaCruzadaAdmin[];
};

export type ResultadoSalvarVendaCruzada =
  | { sucesso: true; mensagem: string }
  | { sucesso: false; mensagem: string };
