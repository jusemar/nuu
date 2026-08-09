"use server";

import { and, eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { fornecedorProdutosApiStagingTable } from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

import { METODOS_LAQUILA } from "../constants";
import { registrarLogIntegracaoFornecedorApi } from "../lib/registrar-log-integracao-fornecedor-api";
import { buscarImportacaoApiLaquila } from "../queries/buscar-importacao-api-laquila";
import { salvarProdutosSelecionadosStagingLaquilaSchema } from "../schemas";

type ResultadoSalvarProdutosSelecionadosStagingLaquila = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  totalSelecionado?: number;
  totalSalvo?: number;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function obterTexto(registro: Record<string, unknown>, chave: string) {
  const valor = registro[chave];

  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);

  return "";
}

/** Código do fornecedor de um item selecionado, venha ele do topo ou do bruto. */
function extrairCodigoSelecionado(valor: unknown) {
  if (!ehRegistro(valor)) return "";

  const dadosBrutos = ehRegistro(valor.dadosBrutosJson)
    ? valor.dadosBrutosJson
    : ehRegistro(valor.dados_brutos_json)
      ? valor.dados_brutos_json
      : {};

  return obterTexto(valor, "cd_item") || obterTexto(dadosBrutos, "cd_item");
}

/**
 * Registra, DENTRO de uma execução, quais produtos o gestor levou adiante.
 *
 * Antes esta action apagava todo o staging da integração e reescrevia com os
 * selecionados — era o que impedia a API de ter ciclos: cada seleção destruía
 * o retrato anterior. Agora o staging já foi gravado pela sincronização, com
 * `importacaoId`, e aqui apenas se marca a triagem do ciclo:
 *
 * - selecionado  → `novo` (segue para Vinculação);
 * - não selecionado → `ignorado` (sai da fila ativa, permanece no histórico).
 *
 * Nada fora desta importação é tocado. Linhas já `vinculado` são preservadas:
 * a decisão de vínculo é anterior e não deve ser desfeita por uma reabertura
 * da tela de seleção.
 */
export async function salvarProdutosSelecionadosStagingLaquila(
  entrada: unknown,
): Promise<ResultadoSalvarProdutosSelecionadosStagingLaquila> {
  const validacao =
    salvarProdutosSelecionadosStagingLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Dados inválidos para salvar produtos selecionados.",
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão não está ativa. Entre novamente para salvar os selecionados.",
    };
  }

  const importacao = await buscarImportacaoApiLaquila(
    validacao.data.importacaoId,
  );

  if (!importacao) {
    return {
      sucesso: false,
      erro: "Importação da API não encontrada.",
    };
  }

  try {
    const codigosSelecionados = Array.from(
      new Set(
        validacao.data.produtos
          .map(extrairCodigoSelecionado)
          .filter((codigo) => codigo.length > 0),
      ),
    );

    // Esta guarda também protege o `notInArray` mais abaixo: no Drizzle,
    // `notInArray(coluna, [])` vira `where true`, e sem sair aqui uma seleção
    // vazia marcaria TODA a execução como ignorada de uma vez.
    if (codigosSelecionados.length === 0) {
      return {
        sucesso: false,
        erro: "Nenhum produto selecionado pôde ser preparado para vinculação.",
        totalSelecionado: validacao.data.produtos.length,
        totalSalvo: 0,
      };
    }

    const agora = new Date();
    const escopoDaExecucao = eq(
      fornecedorProdutosApiStagingTable.importacaoId,
      importacao.id,
    );

    const selecionados = await db
      .update(fornecedorProdutosApiStagingTable)
      .set({ status: "novo", atualizadoEm: agora })
      .where(
        and(
          escopoDaExecucao,
          inArray(
            fornecedorProdutosApiStagingTable.codigoFornecedor,
            codigosSelecionados,
          ),
          eq(fornecedorProdutosApiStagingTable.status, "ignorado"),
        ),
      )
      .returning({ id: fornecedorProdutosApiStagingTable.id });

    await db
      .update(fornecedorProdutosApiStagingTable)
      .set({ status: "ignorado", atualizadoEm: agora })
      .where(
        and(
          escopoDaExecucao,
          notInArray(
            fornecedorProdutosApiStagingTable.codigoFornecedor,
            codigosSelecionados,
          ),
          inArray(fornecedorProdutosApiStagingTable.status, [
            "novo",
            "atencao",
          ]),
        ),
      );

    // Execuções antigas podem não ter a integração no `configuracaoFluxoJson`;
    // nesse caso o log é dispensável, não vale falhar a triagem por ele.
    if (!importacao.integracaoApiId) {
      revalidatePath(
        `/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/vinculos`,
      );

      return {
        sucesso: true,
        mensagem: "Produtos selecionados salvos para vinculação.",
        totalSelecionado: validacao.data.produtos.length,
        totalSalvo: codigosSelecionados.length,
      };
    }

    await registrarLogIntegracaoFornecedorApi({
      integracaoApiId: importacao.integracaoApiId,
      metodo: METODOS_LAQUILA.consultarItem,
      operacao: "salvar_selecionados_staging_laquila",
      status: "sucesso",
      mensagem: "Triagem da execução Laquila registrada no staging.",
      responseResumo: {
        importacaoId: importacao.id,
        totalSelecionado: validacao.data.produtos.length,
        totalCodigosSelecionados: codigosSelecionados.length,
        totalReativados: selecionados.length,
      },
    }).catch(() => undefined);

    revalidatePath(
      `/admin/fornecedores/integracoes/laquila/importacoes/${importacao.id}/vinculos`,
    );

    return {
      sucesso: true,
      mensagem: "Produtos selecionados salvos para vinculação.",
      totalSelecionado: validacao.data.produtos.length,
      totalSalvo: codigosSelecionados.length,
    };
  } catch (erro) {
    console.error("[salvarProdutosSelecionadosStagingLaquila]", {
      importacaoId: importacao.id,
      mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
    });

    return {
      sucesso: false,
      erro: "Não foi possível salvar os produtos selecionados para vinculação.",
    };
  }
}
