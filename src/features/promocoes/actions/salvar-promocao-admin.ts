"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  regrasPromocaoCategoriasTable,
  regrasPromocaoFretesGratisTable,
  regrasPromocaoMarcasTable,
  regrasPromocaoProdutosTable,
  regrasPromocaoSubtotaisTable,
  regrasPromocaoTable,
} from "../../../db/schema";
import { dbTransacional } from "../../../db/transaction";
import { salvarPromocaoAdminSchema } from "../schemas";

function revalidarPromocoesAdmin() {
  revalidatePath("/admin/marketing/promocoes");
}

export async function salvarPromocaoAdmin(entrada: unknown) {
  const dados = salvarPromocaoAdminSchema.parse(entrada);
  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    const valoresRegra = {
      nome: dados.nome,
      slug: dados.slug,
      status: dados.status,
      tipoBeneficio: dados.tipoBeneficio,
      tipoCampanha: dados.tipoCampanha,
      tipoDesconto: dados.tipoDesconto,
      prioridade: dados.prioridade,
      acumulativa: dados.acumulativa,
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim ?? null,
      badgePromocional:
        dados.badgePromocional?.trim() ||
        (dados.tipoCampanha === "relampago" ? "Oferta relâmpago" : null),
      countdownPromocionalDataFim:
        dados.tipoCampanha === "relampago"
          ? (dados.countdownPromocionalDataFim ?? dados.dataFim ?? null)
          : null,
      atualizadoEm: agora,
    };

    const regraPromocaoId =
      dados.id ??
      (
        await tx
          .insert(regrasPromocaoTable)
          .values({
            ...valoresRegra,
            criadoEm: agora,
          })
          .returning({ id: regrasPromocaoTable.id })
      )[0]!.id;

    if (dados.id) {
      await tx
        .update(regrasPromocaoTable)
        .set(valoresRegra)
        .where(eq(regrasPromocaoTable.id, dados.id));
    }

    await tx
      .delete(regrasPromocaoProdutosTable)
      .where(eq(regrasPromocaoProdutosTable.regraPromocaoId, regraPromocaoId));
    await tx
      .delete(regrasPromocaoCategoriasTable)
      .where(
        eq(regrasPromocaoCategoriasTable.regraPromocaoId, regraPromocaoId),
      );
    await tx
      .delete(regrasPromocaoMarcasTable)
      .where(eq(regrasPromocaoMarcasTable.regraPromocaoId, regraPromocaoId));
    await tx
      .delete(regrasPromocaoSubtotaisTable)
      .where(eq(regrasPromocaoSubtotaisTable.regraPromocaoId, regraPromocaoId));
    await tx
      .delete(regrasPromocaoFretesGratisTable)
      .where(
        eq(regrasPromocaoFretesGratisTable.regraPromocaoId, regraPromocaoId),
      );

    const produtosPromocao =
      dados.produtos.length > 0
        ? dados.produtos
        : dados.produtosIds.map((produtoId) => ({
            produtoId,
            modalidade: null,
          }));

    if (produtosPromocao.length > 0) {
      await tx.insert(regrasPromocaoProdutosTable).values(
        produtosPromocao.map((produto) => ({
          regraPromocaoId,
          produtoId: produto.produtoId,
          modalidade: produto.modalidade,
          tipoDesconto: dados.tipoDesconto,
          valorDesconto: dados.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (dados.categoriasIds.length > 0) {
      await tx.insert(regrasPromocaoCategoriasTable).values(
        dados.categoriasIds.map((categoriaId) => ({
          regraPromocaoId,
          categoriaId,
          tipoDesconto: dados.tipoDesconto,
          valorDesconto: dados.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (dados.marcasIds.length > 0) {
      await tx.insert(regrasPromocaoMarcasTable).values(
        dados.marcasIds.map((marcaId) => ({
          regraPromocaoId,
          marcaId,
          tipoDesconto: dados.tipoDesconto,
          valorDesconto: dados.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (dados.subtotalMinimo !== null && dados.subtotalMinimo !== undefined) {
      await tx.insert(regrasPromocaoSubtotaisTable).values({
        regraPromocaoId,
        subtotalMinimo: dados.subtotalMinimo,
        subtotalMaximo: dados.subtotalMaximo ?? null,
        tipoDesconto: dados.tipoDesconto,
        valorDesconto: dados.valorDesconto,
        criadoEm: agora,
      });
    }

    if (
      dados.tipoBeneficio === "frete_gratis" &&
      dados.freteGratisSubtotalMinimo !== null &&
      dados.freteGratisSubtotalMinimo !== undefined
    ) {
      await tx.insert(regrasPromocaoFretesGratisTable).values({
        regraPromocaoId,
        subtotalMinimo: dados.freteGratisSubtotalMinimo,
        modalidade: dados.freteGratisModalidade ?? null,
        mensagemProgressiva:
          dados.freteGratisMensagemProgressiva?.trim() || null,
        regiaoCodigo: dados.freteGratisRegiaoCodigo ?? null,
        transportadoraCodigo: dados.freteGratisTransportadoraCodigo ?? null,
        servicoCodigo: dados.freteGratisServicoCodigo ?? null,
        criadoEm: agora,
      });
    }
  });

  revalidarPromocoesAdmin();

  return { success: true };
}
