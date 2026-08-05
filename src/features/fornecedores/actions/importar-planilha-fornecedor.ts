"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  montarMensagemArquivoAcimaDoLimite,
  TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_BYTES,
} from "../constants/importacao-arquivo";
import { importarPlanilhaFornecedorParaStaging } from "../services/importacao-planilha-fornecedor.service";
import type { EstadoEnvioPlanilhaFornecedor } from "../types/fornecedores.types";

/**
 * Valida a entrada do formulário e envia a planilha para o staging.
 *
 * Devolve `{ erro }` em vez de lançar exceção, para que quem chamar decida
 * como apresentar a falha.
 */
async function processarEnvioPlanilhaFornecedor(
  formData: FormData,
): Promise<{ importacaoId: string } | { erro: string }> {
  const fornecedorId = String(formData.get("fornecedorId") ?? "");
  const arquivo = formData.get("arquivo");

  if (!fornecedorId) {
    return { erro: "Selecione um fornecedor antes de importar o arquivo." };
  }

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Arquivo de importação não enviado." };
  }

  // Rede de segurança do servidor: cobre JavaScript desabilitado e chamadas
  // diretas à action, cenários em que a checagem do formulário não roda.
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO_BYTES) {
    return { erro: montarMensagemArquivoAcimaDoLimite(arquivo.size) };
  }

  try {
    const resultado = await importarPlanilhaFornecedorParaStaging(
      fornecedorId,
      arquivo,
    );

    return { importacaoId: resultado.importacaoId };
  } catch (erro) {
    console.error("[importar-planilha-fornecedor:erro]", erro);

    return {
      erro:
        erro instanceof Error && erro.message
          ? erro.message
          : "Não foi possível importar a planilha. Tente novamente.",
    };
  }
}

/**
 * Versão usada pelo formulário via `useActionState`.
 *
 * Em caso de sucesso redireciona para o detalhe da importação; em caso de
 * falha devolve a mensagem para ser exibida na própria tela, sem recarregar.
 */
export async function importarPlanilhaFornecedorComEstado(
  _estadoAnterior: EstadoEnvioPlanilhaFornecedor,
  formData: FormData,
): Promise<EstadoEnvioPlanilhaFornecedor> {
  const resultado = await processarEnvioPlanilhaFornecedor(formData);

  if ("erro" in resultado) {
    return { erro: resultado.erro };
  }

  revalidatePath("/admin/fornecedores/importacoes");

  // `redirect()` fica fora do try/catch de propósito: ele sinaliza o desvio
  // lançando um erro interno do Next, que não deve ser capturado.
  redirect(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}

/**
 * Assinatura original, mantida para uso direto em `<form action={...}>`.
 *
 * Continua lançando exceção em caso de falha — quem já dependia dela não muda
 * de comportamento.
 */
export async function importarPlanilhaFornecedor(formData: FormData) {
  const resultado = await processarEnvioPlanilhaFornecedor(formData);

  if ("erro" in resultado) {
    throw new Error(resultado.erro);
  }

  revalidatePath("/admin/fornecedores/importacoes");
  redirect(`/admin/fornecedores/importacoes/${resultado.importacaoId}`);
}
