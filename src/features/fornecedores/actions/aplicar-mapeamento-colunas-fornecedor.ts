"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CampoMapeamentoColunaFornecedor } from "../types/fornecedores.types";
import { aplicarMapeamentoColunasFornecedor } from "../services/aplicar-mapeamento-colunas-fornecedor.service";

export async function aplicarMapeamentoColunasFornecedorAction(
  formData: FormData,
) {
  const importacaoId = String(formData.get("importacaoId") ?? "");
  const salvarParaFornecedor =
    String(formData.get("salvarParaFornecedor") ?? "") === "true";
  const colunas = formData.getAll("nomeColunaOrigem").map(String);
  const destinos = formData.getAll("campoDestino").map(String);
  const mapeamentos = colunas
    .map((nomeColunaOrigem, indice) => ({
      nomeColunaOrigem,
      campoDestino: destinos[indice] as CampoMapeamentoColunaFornecedor,
    }))
    .filter(
      (mapeamento) =>
        mapeamento.nomeColunaOrigem.trim().length > 0 &&
        mapeamento.campoDestino.trim().length > 0,
    );

  await aplicarMapeamentoColunasFornecedor({
    importacaoId,
    mapeamentos,
    salvarParaFornecedor,
  });

  revalidatePath(`/admin/fornecedores/importacoes/${importacaoId}`);
  revalidatePath("/admin/fornecedores/importacoes");
  redirect(`/admin/fornecedores/importacoes/${importacaoId}?etapa=vinculacao`);
}
