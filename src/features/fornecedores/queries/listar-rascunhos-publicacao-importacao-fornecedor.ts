import "server-only";

import type { RascunhoPublicacaoFornecedor } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";

import { listarRascunhosImportacaoFornecedor } from "./listar-rascunhos-importacao-fornecedor";

export async function listarRascunhosPublicacaoImportacaoFornecedor(
  importacaoId: string,
): Promise<RascunhoPublicacaoFornecedor[]> {
  const rascunhos = await listarRascunhosImportacaoFornecedor(importacaoId);

  return rascunhos
    .filter(
      (rascunho) =>
        rascunho.status === "pronto_para_publicar" &&
        rascunho.pendencias.length === 0 &&
        Boolean(rascunho.fornecedorId) &&
        Boolean(rascunho.codigoFornecedor?.trim()),
    )
    .map((rascunho) => ({
      id: rascunho.id,
      codigoFornecedor: rascunho.codigoFornecedor,
      nome: rascunho.nome,
      categoriaNome: rascunho.categoriaNome,
      marcaNome: rascunho.marcaNome,
      precoLoja: rascunho.precoLoja,
      estoqueFornecedor: rascunho.estoqueFornecedor,
      imagemUrl: rascunho.imagens[0] ?? null,
      pronto: true,
      pendencias: [],
    }));
}
