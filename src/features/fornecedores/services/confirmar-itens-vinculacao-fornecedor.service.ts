import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";

import { resolverPrecoFinalStagingFornecedor } from "../lib/resolver-preco-final-staging-fornecedor";
import { salvarProdutoRascunhoFornecedor } from "./salvar-produto-rascunho-fornecedor.service";

export type ResultadoConfirmarItensVinculacaoFornecedor = {
  /** Itens vinculados que ganharam (ou tiveram atualizado) um rascunho de atualização. */
  confirmados: string[];
  /** Itens "novo" que já tinham rascunho — nada a fazer, só seguem para Conciliação. */
  jaProcessados: string[];
  /** Itens que não podem avançar ainda, com o motivo. */
  naoElegiveis: Array<{ stagingId: string; motivo: string }>;
};

/**
 * Confirma a seleção feita na Vinculação para avançar à Conciliação.
 *
 * Itens "novo" já ganham seu rascunho no momento em que são marcados como
 * novo — aqui só são reconhecidos como já processados. Itens vinculados a um
 * produto real ainda não tinham nenhum registro que sobrevivesse entre
 * etapas: esta função cria (ou atualiza, se já existir) esse registro em
 * `produto_rascunhos` com `produtoAtualizadoId` preenchido, o que a
 * Conciliação e a Publicação usam para tratá-lo como "atualizar" em vez de
 * "criar".
 *
 * Processamento parcial é a regra, não a exceção: só os `stagingIds` recebidos
 * são tocados. As demais linhas do staging continuam exatamente como estavam,
 * disponíveis para um lote futuro.
 */
export async function confirmarItensVinculacaoFornecedor(
  importacaoId: string,
  stagingIds: string[],
): Promise<ResultadoConfirmarItensVinculacaoFornecedor> {
  if (stagingIds.length === 0) {
    return { confirmados: [], jaProcessados: [], naoElegiveis: [] };
  }

  const idsUnicos = Array.from(new Set(stagingIds));

  // Leitura protegida pela política central: as duas consultas são dependentes
  // (a segunda só faz sentido se a importação existe) e ficam juntas para a
  // retentativa refazer o par coerente.
  const { importacao, linhas } = await executarLeituraFornecedores(
    {
      etapa: "vinculacao:confirmar-selecao",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível enviar os itens selecionados para a Conciliação agora. Tente novamente em alguns segundos.",
    },
    async () => {
      const [registro] = await db
        .select({ fornecedorId: importacoesFornecedorTable.fornecedorId })
        .from(importacoesFornecedorTable)
        .where(eq(importacoesFornecedorTable.id, importacaoId))
        .limit(1);

      return {
        importacao: registro ?? null,
        linhas: registro
          ? await db
              .select({
                id: fornecedorProdutosStagingTable.id,
                codigoFornecedor:
                  fornecedorProdutosStagingTable.codigoFornecedor,
                nomeProduto: fornecedorProdutosStagingTable.nomeProduto,
                precoFornecedor: fornecedorProdutosStagingTable.precoFornecedor,
                precoOriginal: fornecedorProdutosStagingTable.precoOriginal,
                precoCalculado: fornecedorProdutosStagingTable.precoCalculado,
                estoqueFornecedor:
                  fornecedorProdutosStagingTable.estoqueFornecedor,
                produtoLocalizadoId:
                  fornecedorProdutosStagingTable.produtoLocalizadoId,
                criterioLocalizacao:
                  fornecedorProdutosStagingTable.criterioLocalizacao,
                status: fornecedorProdutosStagingTable.status,
              })
              .from(fornecedorProdutosStagingTable)
              .where(
                and(
                  eq(fornecedorProdutosStagingTable.importacaoId, importacaoId),
                  inArray(fornecedorProdutosStagingTable.id, idsUnicos),
                ),
              )
          : [],
      };
    },
  );

  // "Não encontrada" é resposta legítima do banco, não falha de leitura.
  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  const confirmados: string[] = [];
  const jaProcessados: string[] = [];
  const naoElegiveis: Array<{ stagingId: string; motivo: string }> = [];

  for (const linha of linhas) {
    if (linha.status === "ignorado") {
      naoElegiveis.push({
        stagingId: linha.id,
        motivo: "Item ignorado não pode avançar para a Conciliação.",
      });
      continue;
    }

    const vinculado = Boolean(linha.produtoLocalizadoId);
    const novo = linha.criterioLocalizacao === "novo_produto_fornecedor";

    if (!vinculado && !novo) {
      naoElegiveis.push({
        stagingId: linha.id,
        motivo:
          "Item ainda sem decisão: vincule a um produto, marque como novo ou ignore antes de continuar.",
      });
      continue;
    }

    if (novo) {
      // "Marcar como novo" já cria o rascunho no mesmo momento da decisão.
      jaProcessados.push(linha.id);
      continue;
    }

    if (!linha.codigoFornecedor?.trim()) {
      naoElegiveis.push({
        stagingId: linha.id,
        motivo: "Item vinculado sem código do fornecedor.",
      });
      continue;
    }

    const precoLoja = resolverPrecoFinalStagingFornecedor(linha);

    await salvarProdutoRascunhoFornecedor({
      origemTipo: "fornecedor_excel",
      origemProvedor: "arquivo_excel",
      fornecedorId: importacao.fornecedorId,
      codigoFornecedor: linha.codigoFornecedor,
      produtoAtualizadoId: linha.produtoLocalizadoId,
      nome: linha.nomeProduto,
      precoFornecedor: linha.precoFornecedor,
      precoLoja: precoLoja !== null ? precoLoja.toFixed(2) : null,
      estoqueFornecedor: linha.estoqueFornecedor,
      status: "pendente_conciliacao",
      dadosOrigemJson: {
        origemFluxoFornecedor: { stagingId: linha.id, importacaoId },
      },
    });

    confirmados.push(linha.id);
  }

  const idsEncontrados = new Set(linhas.map((linha) => linha.id));
  for (const stagingId of idsUnicos) {
    if (!idsEncontrados.has(stagingId)) {
      naoElegiveis.push({
        stagingId,
        motivo: "Item não encontrado nesta importação.",
      });
    }
  }

  return { confirmados, jaProcessados, naoElegiveis };
}
