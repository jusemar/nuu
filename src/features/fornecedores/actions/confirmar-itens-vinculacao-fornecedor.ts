"use server";

import { revalidatePath } from "next/cache";

import { ErroLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { possuiSessaoFornecedoresAdmin } from "../lib/sessao-fornecedores-admin";
import { confirmarItensVinculacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import { confirmarItensVinculacaoFornecedor } from "../services/confirmar-itens-vinculacao-fornecedor.service";

type EntradaConfirmarItensVinculacaoFornecedor = {
  importacaoId: string;
  stagingIds: string[];
};

/**
 * Confirma, a partir da Vinculação, os itens selecionados pelo gestor para
 * avançarem à Conciliação — os demais permanecem no staging, disponíveis
 * para um lote futuro.
 */
export async function confirmarItensVinculacaoFornecedorAction(
  entrada: EntradaConfirmarItensVinculacaoFornecedor,
) {
  const validacao = confirmarItensVinculacaoFornecedorSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro: "Selecione ao menos um item para continuar.",
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  try {
    const resultado = await confirmarItensVinculacaoFornecedor(
      validacao.data.importacaoId,
      validacao.data.stagingIds,
    );

    if (
      resultado.confirmados.length === 0 &&
      resultado.jaProcessados.length === 0
    ) {
      return {
        sucesso: false,
        erro:
          resultado.naoElegiveis[0]?.motivo ??
          "Nenhum item selecionado pôde avançar para a Conciliação.",
      };
    }

    revalidatePath(
      `/admin/fornecedores/importacoes/${validacao.data.importacaoId}`,
    );

    const total = resultado.confirmados.length + resultado.jaProcessados.length;
    const complemento =
      resultado.naoElegiveis.length > 0
        ? ` ${resultado.naoElegiveis.length} não pôde${resultado.naoElegiveis.length === 1 ? "" : "ram"} avançar.`
        : "";

    return {
      sucesso: true,
      mensagem: `${total} item${total === 1 ? "" : "s"} enviado${total === 1 ? "" : "s"} para a Conciliação.${complemento}`,
      naoElegiveis: resultado.naoElegiveis,
    };
  } catch (erro) {
    console.error("[fornecedores] falha ao confirmar itens da vinculação", {
      importacaoId: validacao.data.importacaoId,
      totalSelecionados: validacao.data.stagingIds.length,
      momento: new Date().toISOString(),
      erro,
    });

    // Só a mensagem de `ErroLeituraFornecedores` é segura para exibir: ela nasce
    // já tratada pela política central. Qualquer outro erro pode carregar o SQL
    // do driver no `message`, então vira texto genérico — o detalhe técnico fica
    // no log acima.
    return {
      sucesso: false,
      erro:
        erro instanceof ErroLeituraFornecedores
          ? erro.message
          : "Não foi possível enviar os itens para a Conciliação. Tente novamente.",
    };
  }
}
