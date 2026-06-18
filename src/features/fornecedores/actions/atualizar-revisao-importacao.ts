"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { atualizarRevisaoImportacaoFornecedor } from "../services/atualizar-revisao-importacao.service";
import { correcaoRevisaoImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";

export async function atualizarRevisaoImportacaoFornecedorAction(
  formData: FormData,
) {
  const stagingIds = formData.getAll("stagingIds").map(String);
  const retornoBusca = String(formData.get("retornoBusca") ?? "");
  const retornoCategoriaRevisao = String(
    formData.get("retornoCategoriaRevisao") ?? "",
  );
  const retornoMarcaRevisao = String(formData.get("retornoMarcaRevisao") ?? "");
  const retornoPagina = String(formData.get("retornoPagina") ?? "1");
  const retornoLimite = String(formData.get("retornoLimite") ?? "10");
  const dados = correcaoRevisaoImportacaoFornecedorSchema.parse({
    importacaoId: formData.get("importacaoId"),
    stagingIds,
    escopo: formData.get("escopo"),
    categoriaId: formData.get("categoriaId") ?? undefined,
    marcaId: formData.get("marcaId") ?? undefined,
    nomeProduto: formData.get("nomeProduto") ?? undefined,
  });

  await atualizarRevisaoImportacaoFornecedor(dados);

  revalidatePath(`/admin/fornecedores/importacoes/${dados.importacaoId}`);

  const parametros = new URLSearchParams({
    etapa: "revisao",
    buscaRevisao: retornoBusca,
    categoriaRevisao: retornoCategoriaRevisao,
    marcaRevisao: retornoMarcaRevisao,
    paginaRevisao: retornoPagina,
    limiteRevisao: retornoLimite,
  });

  redirect(
    `/admin/fornecedores/importacoes/${dados.importacaoId}?${parametros.toString()}`,
  );
}
