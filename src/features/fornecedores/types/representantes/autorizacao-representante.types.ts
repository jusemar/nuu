import type { ContextoAdministrativo } from "@/features/autenticacao/types/autorizacao-admin.types";

export type OperacaoProdutoRepresentante = "visualizar" | "administrar";
export type VinculoRepresentante = {
  id: string;
  usuarioId: string;
  fornecedorId: string;
  ativo: boolean;
  fornecedorAtivo: boolean;
};
export type AutorizacaoProdutoRepresentante = {
  representanteFornecedorId: string;
  produtoId: string;
  ativa: boolean;
};
export type ContextoRepresentante = {
  administrativo: ContextoAdministrativo;
  vinculos: readonly VinculoRepresentante[];
};
export type RecursoProdutoRepresentante = {
  fornecedorId: string;
  produtoId: string;
  operacao: OperacaoProdutoRepresentante;
};
