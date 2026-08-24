"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { ErroLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { exigirAcessoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
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

/**
 * Resultado devolvido ao formulário quando a aplicação do mapeamento falha.
 *
 * `null` significa "nada a relatar": ou o formulário ainda não foi enviado, ou
 * o envio deu certo e terminou em `redirect()` — nesse caso esta função nem
 * chega a retornar.
 */
export type EstadoAplicarMapeamentoFornecedor = { erro: string } | null;

export async function aplicarMapeamentoColunasFornecedorAction(
  _estadoAnterior: EstadoAplicarMapeamentoFornecedor,
  formData: FormData,
): Promise<EstadoAplicarMapeamentoFornecedor> {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);
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
  //
  // A falha é DEVOLVIDA, não lançada: lançar derrubava a página inteira na error
  // boundary e o gestor perdia o mapeamento que acabara de configurar na tela —
  // no celular isso significa refazer tudo. Devolvendo, o formulário continua
  // montado, a mensagem aparece ao lado do botão e o botão volta a aceitar clique.
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

    // `ErroLeituraFornecedores` já nasce com texto amigável e sem SQL — a
    // política de leitura segura continua sendo a única dona dessa mensagem.
    if (erro instanceof ErroLeituraFornecedores) {
      return { erro: erro.message };
    }

    return {
      erro: "Não foi possível aplicar o mapeamento agora. Tente novamente em alguns segundos.",
    };
  }

  revalidatePath(`/admin/fornecedores/importacoes/${importacaoId}`);
  revalidatePath("/admin/fornecedores/importacoes");
  // Fica FORA do `try`: o `redirect` do Next funciona lançando uma exceção de controle de
  // fluxo. Dentro do `try` ele seria confundido com erro e a navegação nunca aconteceria.
  // O `importacaoId` é o mesmo lido do formulário no início — a etapa seguinte abre na
  // importação certa.
  redirect(`/admin/fornecedores/importacoes/${importacaoId}?etapa=vinculacao`);
}
