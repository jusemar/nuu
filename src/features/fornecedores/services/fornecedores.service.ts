import type { FornecedorComResumoImportacoes } from "../types/fornecedores.types";

export const rotulosTipoIntegracaoFornecedor = {
  arquivo_excel: "Arquivo Excel",
  api: "API",
} as const;

export const rotulosStatusFornecedor = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
} as const;

export function ordenarFornecedoresPorStatusENome(
  fornecedores: FornecedorComResumoImportacoes[],
) {
  return [...fornecedores].sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.nome.localeCompare(b.nome);
  });
}
