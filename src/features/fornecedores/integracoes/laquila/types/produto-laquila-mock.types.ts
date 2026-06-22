export type StatusProdutoLaquilaMock =
  | "novo"
  | "vinculado"
  | "atencao"
  | "ignorado";

export type ProdutoLaquilaMock = {
  id: string;
  codigo: string;
  nome: string;
  marca: string;
  grupo: string;
  categoria: string;
  ean: string;
  ncm: string;
  preco: number | null;
  estoque: number | null;
  status: StatusProdutoLaquilaMock;
  imagemUrl: string;
  recebidoEm?: Date;
  dadosBrutosJson?: Record<string, unknown>;
};
