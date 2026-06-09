import type {
  ItemPreviewSincronizacaoFornecedor,
  ResumoPreviewSincronizacaoFornecedor,
} from "../types/fornecedores.types";

export function resumirPreviewImportacaoFornecedor(
  itens: ItemPreviewSincronizacaoFornecedor[],
): ResumoPreviewSincronizacaoFornecedor {
  return {
    totalImportado: itens.length,
    totalProntosParaSincronizar: itens.filter(
      (item) => item.situacao === "pronto_para_sincronizar",
    ).length,
    totalPendentesVinculacao: itens.filter(
      (item) => item.situacao === "pendente_vinculacao",
    ).length,
    totalComErro: itens.filter((item) => item.situacao === "bloqueado").length,
  };
}
