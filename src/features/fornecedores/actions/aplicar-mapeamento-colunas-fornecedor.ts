"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ErroLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { aplicarMapeamentoColunasFornecedor } from "../services/aplicar-mapeamento-colunas-fornecedor.service";
import type { CampoMapeamentoColunaFornecedor } from "../types/fornecedores.types";

function lerConfiguracaoFluxo(formData: FormData): Record<string, unknown> {
  const valor = String(formData.get("configuracaoFluxoJson") ?? "").trim();

  if (!valor) return {};

  try {
    const configuracao: unknown = JSON.parse(valor);

    if (
      !configuracao ||
      typeof configuracao !== "object" ||
      Array.isArray(configuracao)
    ) {
      throw new Error("Formato inválido.");
    }

    return configuracao as Record<string, unknown>;
  } catch {
    throw new Error("A configuração do fluxo da importação é inválida.");
  }
}

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

  // Rede de segurança final: as leituras já devolvem mensagem amigável, mas uma falha em
  // qualquer outro ponto do service chegaria crua ao navegador (foi assim que o SQL do
  // `select ... from importacoes_fornecedor` acabou visível para o usuário).
  try {
    await aplicarMapeamentoColunasFornecedor({
      importacaoId,
      mapeamentos,
      salvarParaFornecedor,
      configuracaoFluxoJson: lerConfiguracaoFluxo(formData),
    });
  } catch (erro) {
    console.error("[fornecedores] falha ao aplicar mapeamento de colunas", {
      importacaoId,
      totalMapeamentos: mapeamentos.length,
      momento: new Date().toISOString(),
      erro,
    });

    if (erro instanceof ErroLeituraFornecedores) throw erro;

    throw new Error(
      "Não foi possível aplicar o mapeamento agora. Tente novamente em alguns segundos.",
    );
  }

  revalidatePath(`/admin/fornecedores/importacoes/${importacaoId}`);
  revalidatePath("/admin/fornecedores/importacoes");
  // Fica FORA do `try`: o `redirect` do Next funciona lançando uma exceção de controle de
  // fluxo. Dentro do `try` ele seria confundido com erro e a navegação nunca aconteceria.
  // O `importacaoId` é o mesmo lido do formulário no início — a etapa seguinte abre na
  // importação certa.
  redirect(`/admin/fornecedores/importacoes/${importacaoId}?etapa=vinculacao`);
}
