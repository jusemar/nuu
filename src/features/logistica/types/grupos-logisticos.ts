export type OrigemExpedicao = "loja" | "fornecedor";

export type ContextoOrigemExpedicao = {
  origemExpedicao: OrigemExpedicao;
  fornecedorProvedor: string | null;
  necessitaEtiquetaFornecedor: boolean;
};

export type ItemAgrupavelLogisticamente = ContextoOrigemExpedicao & {
  produtoId: string;
  varianteId?: string | null;
  quantidade: number;
};

export type GrupoLogistico<
  TItem extends ItemAgrupavelLogisticamente = ItemAgrupavelLogisticamente,
> = ContextoOrigemExpedicao & {
  chave: string;
  itens: TItem[];
};
