import type { DadosProdutoRepresentante } from "../../schemas/representantes/produto-representante.schema";

export type PerfilProdutosAdmin = {
  representante: boolean;
  principal: boolean;
  podeEscrever: boolean;
  fornecedores: { id: string; nome: string }[];
};
export type ContextoProdutoRepresentante = {
  fornecedorId: string;
  codigoFornecedor: string;
  estoque: number;
  comissao: { tipo: "percentual" | "fixa"; valor: number } | null;
  comercialValido: boolean;
};
export type ProdutoRepresentanteResumo = {
  id: string;
  nome: string;
  sku: string;
  imagem: string | null;
  precoCentavos: number | null;
  versao: string;
  situacao: string;
  editavel: boolean;
  contextos: ContextoProdutoRepresentante[];
};
export type ProdutoRepresentanteEdicao = {
  id: string;
  sku: string;
  versao: string;
  dados: DadosProdutoRepresentante;
  imagens: { id: string; url: string; alt: string; principal: boolean }[];
};
