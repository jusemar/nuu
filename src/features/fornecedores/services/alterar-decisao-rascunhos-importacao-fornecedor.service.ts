import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  fornecedorProdutosApiStagingTable,
  fornecedorProdutosStagingTable,
  fornecedorProdutoVinculosTable,
  produtoRascunhosTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { listarPendenciasAtualizacaoRascunhoFornecedor } from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";
import {
  ORIGEM_IMPORTACAO_ARQUIVO,
  type OrigemImportacaoFornecedor,
} from "@/features/fornecedores/lib/origem-importacao-fornecedor";
import { buscarOrigemImportacaoFornecedor } from "@/features/fornecedores/queries/buscar-origem-importacao-fornecedor";

export class ErroDecisaoRascunhoFornecedor extends Error {}

type EntradaAlterarDecisaoRascunhosImportacaoFornecedor = {
  importacaoId: string;
  rascunhoIds: string[];
  acao: "ignorar" | "desfazer" | "aprovar";
  /** Origem da importação. Quando ausente, é lida da própria importação. */
  origem?: OrigemImportacaoFornecedor;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairStagingId(dadosOrigemJson: unknown) {
  if (!ehRegistro(dadosOrigemJson)) return null;

  const origem = dadosOrigemJson.origemFluxoFornecedor;
  if (!ehRegistro(origem)) return null;

  return z.uuid().safeParse(origem.stagingId).data ?? null;
}

export async function alterarDecisaoRascunhosImportacaoFornecedorService({
  importacaoId,
  rascunhoIds,
  acao,
  origem: origemInformada,
}: EntradaAlterarDecisaoRascunhosImportacaoFornecedor) {
  const origem =
    origemInformada ??
    (await buscarOrigemImportacaoFornecedor(importacaoId)) ??
    ORIGEM_IMPORTACAO_ARQUIVO;
  const idsUnicos = Array.from(new Set(rascunhoIds));
  const rascunhos = await db
    .select({
      id: produtoRascunhosTable.id,
      fornecedorId: produtoRascunhosTable.fornecedorId,
      codigoFornecedor: produtoRascunhosTable.codigoFornecedor,
      dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
      produtoAtualizadoId: produtoRascunhosTable.produtoAtualizadoId,
      precoLoja: produtoRascunhosTable.precoLoja,
    })
    .from(produtoRascunhosTable)
    .where(
      and(
        inArray(produtoRascunhosTable.id, idsUnicos),
        eq(produtoRascunhosTable.origemTipo, origem.origemTipo),
        eq(produtoRascunhosTable.origemProvedor, origem.origemProvedor),
        inArray(produtoRascunhosTable.status, [
          "rascunho",
          "pendente_conciliacao",
          "pronto_para_publicar",
        ]),
        sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
      ),
    );

  if (rascunhos.length !== idsUnicos.length) {
    throw new ErroDecisaoRascunhoFornecedor(
      "Um ou mais rascunhos não pertencem a esta importação.",
    );
  }

  const stagingIds = rascunhos
    .map((rascunho) => extrairStagingId(rascunho.dadosOrigemJson))
    .filter((id): id is string => Boolean(id));

  if (stagingIds.length !== rascunhos.length) {
    throw new ErroDecisaoRascunhoFornecedor(
      "Não foi possível localizar a linha de origem de um dos itens.",
    );
  }

  const fornecedoresIds = Array.from(
    new Set(
      rascunhos
        .map((rascunho) => rascunho.fornecedorId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const vinculosAtivos =
    fornecedoresIds.length > 0
      ? await db
          .select({
            fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
            codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
          })
          .from(fornecedorProdutoVinculosTable)
          .where(
            and(
              inArray(
                fornecedorProdutoVinculosTable.fornecedorId,
                fornecedoresIds,
              ),
              eq(fornecedorProdutoVinculosTable.status, "ativo"),
            ),
          )
      : [];
  const chavesPublicadas = new Set(
    vinculosAtivos.map(
      (vinculo) =>
        `${vinculo.fornecedorId}:${vinculo.codigoFornecedor?.trim() ?? ""}`,
    ),
  );
  // O sinal "vínculo ativo = já publicado" só faz sentido para rascunhos
  // "criar produto novo" — rascunhos "atualizar" já nascem com vínculo ativo
  // desde a Vinculação, então essa checagem não se aplica a eles.
  const possuiPublicado = rascunhos.some(
    (rascunho) =>
      !rascunho.produtoAtualizadoId &&
      rascunho.fornecedorId &&
      chavesPublicadas.has(
        `${rascunho.fornecedorId}:${rascunho.codigoFornecedor?.trim() ?? ""}`,
      ),
  );

  if (possuiPublicado) {
    throw new ErroDecisaoRascunhoFornecedor(
      "Este item já foi publicado e não pode voltar para a triagem.",
    );
  }

  if (acao === "aprovar") {
    // Aprovação é o portão explícito que separa "conciliado" de "elegível para
    // publicação". Só existe para o caminho "atualizar produto vinculado".
    const invalidos = rascunhos.filter(
      (rascunho) => !rascunho.produtoAtualizadoId,
    );
    if (invalidos.length > 0) {
      throw new ErroDecisaoRascunhoFornecedor(
        "Aprovação só se aplica a itens de atualização de produto vinculado.",
      );
    }

    const semPreco = rascunhos.filter(
      (rascunho) =>
        listarPendenciasAtualizacaoRascunhoFornecedor(rascunho.precoLoja)
          .length > 0,
    );
    if (semPreco.length > 0) {
      throw new ErroDecisaoRascunhoFornecedor(
        "Defina o preço a aplicar antes de aprovar a atualização.",
      );
    }
  }

  const agora = new Date();
  const origemApi = origem.origemTipo === "fornecedor_api";

  await dbTransacional.transaction(async (tx) => {
    /**
     * Devolve a linha de staging desta importação ao estado indicado.
     *
     * As duas origens guardam o staging em tabelas diferentes (a planilha em
     * `fornecedor_produtos_staging`, a API em `fornecedor_produtos_api_staging`)
     * com enums de status próprios. O `importacaoId` no `where` é o que garante
     * que a decisão de um ciclo nunca alcance a linha de outro.
     */
    async function reverterStaging(
      ids: string[],
      destino: "ignorado" | "disponivel",
    ) {
      if (ids.length === 0) return;

      if (origemApi) {
        await tx
          .update(fornecedorProdutosApiStagingTable)
          .set({
            status: destino === "ignorado" ? "ignorado" : "novo",
            atualizadoEm: agora,
          })
          .where(
            and(
              eq(fornecedorProdutosApiStagingTable.importacaoId, importacaoId),
              inArray(fornecedorProdutosApiStagingTable.id, ids),
            ),
          );
        return;
      }

      await tx
        .update(fornecedorProdutosStagingTable)
        .set({
          status: destino === "ignorado" ? "ignorado" : "aguardando_analise",
          ...(destino === "ignorado"
            ? {}
            : { produtoLocalizadoId: null, criterioLocalizacao: null }),
          atualizadoEm: agora,
        })
        .where(
          and(
            eq(fornecedorProdutosStagingTable.importacaoId, importacaoId),
            inArray(fornecedorProdutosStagingTable.id, ids),
          ),
        );
    }

    if (acao === "ignorar") {
      await tx
        .update(produtoRascunhosTable)
        .set({ status: "ignorado", atualizadoEm: agora })
        .where(inArray(produtoRascunhosTable.id, idsUnicos));
      await reverterStaging(stagingIds, "ignorado");
      return;
    }

    if (acao === "aprovar") {
      await tx
        .update(produtoRascunhosTable)
        .set({ status: "pronto_para_publicar", atualizadoEm: agora })
        .where(inArray(produtoRascunhosTable.id, idsUnicos));
      return;
    }

    // "desfazer": para itens "atualizar", o vínculo com o produto real foi
    // decidido na Vinculação e não deve ser desfeito aqui — só a seleção
    // para este lote de conciliação é revertida (apagar o rascunho basta).
    const stagingIdsCriar = rascunhos
      .filter((rascunho) => !rascunho.produtoAtualizadoId)
      .map((rascunho) => extrairStagingId(rascunho.dadosOrigemJson))
      .filter((id): id is string => Boolean(id));

    await tx
      .delete(produtoRascunhosTable)
      .where(inArray(produtoRascunhosTable.id, idsUnicos));

    await reverterStaging(stagingIdsCriar, "disponivel");
  });

  return { totalAtualizados: rascunhos.length, acao };
}
