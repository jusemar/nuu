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
import { idPromocaoAdminSchema } from "../schemas";

function criarSlugDuplicado(slug: string) {
  return `${slug}-copia-${Date.now().toString(36)}`;
}

export async function duplicarPromocaoAdmin(id: string) {
  const promocaoId = idPromocaoAdminSchema.parse(id);
  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    const promocao = await tx.query.regrasPromocaoTable.findFirst({
      where: eq(regrasPromocaoTable.id, promocaoId),
      with: {
        produtos: true,
        categorias: true,
        marcas: true,
        subtotais: true,
        fretesGratis: true,
      },
    });

    if (!promocao) {
      throw new Error("Promoção não encontrada.");
    }

    const novaPromocao = await tx
      .insert(regrasPromocaoTable)
      .values({
        nome: `${promocao.nome} (cópia)`,
        slug: criarSlugDuplicado(promocao.slug),
        status: "inativa",
        tipoBeneficio: promocao.tipoBeneficio,
        tipoCampanha: promocao.tipoCampanha,
        tipoDesconto: promocao.tipoDesconto,
        prioridade: promocao.prioridade,
        acumulativa: promocao.acumulativa,
        dataInicio: promocao.dataInicio,
        dataFim: promocao.dataFim,
        badgePromocional: promocao.badgePromocional,
        countdownPromocionalDataFim: promocao.countdownPromocionalDataFim,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .returning({ id: regrasPromocaoTable.id });

    const novaPromocaoId = novaPromocao[0]!.id;

    if (promocao.produtos.length > 0) {
      await tx.insert(regrasPromocaoProdutosTable).values(
        promocao.produtos.map((produto) => ({
          regraPromocaoId: novaPromocaoId,
          produtoId: produto.produtoId,
          modalidade: produto.modalidade,
          tipoDesconto: produto.tipoDesconto,
          valorDesconto: produto.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (promocao.categorias.length > 0) {
      await tx.insert(regrasPromocaoCategoriasTable).values(
        promocao.categorias.map((categoria) => ({
          regraPromocaoId: novaPromocaoId,
          categoriaId: categoria.categoriaId,
          tipoDesconto: categoria.tipoDesconto,
          valorDesconto: categoria.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (promocao.marcas.length > 0) {
      await tx.insert(regrasPromocaoMarcasTable).values(
        promocao.marcas.map((marca) => ({
          regraPromocaoId: novaPromocaoId,
          marcaId: marca.marcaId,
          tipoDesconto: marca.tipoDesconto,
          valorDesconto: marca.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (promocao.subtotais.length > 0) {
      await tx.insert(regrasPromocaoSubtotaisTable).values(
        promocao.subtotais.map((subtotal) => ({
          regraPromocaoId: novaPromocaoId,
          subtotalMinimo: subtotal.subtotalMinimo,
          subtotalMaximo: subtotal.subtotalMaximo,
          tipoDesconto: subtotal.tipoDesconto,
          valorDesconto: subtotal.valorDesconto,
          criadoEm: agora,
        })),
      );
    }

    if (promocao.fretesGratis.length > 0) {
      await tx.insert(regrasPromocaoFretesGratisTable).values(
        promocao.fretesGratis.map((freteGratis) => ({
          regraPromocaoId: novaPromocaoId,
          subtotalMinimo: freteGratis.subtotalMinimo,
          modalidade: freteGratis.modalidade,
          mensagemProgressiva: freteGratis.mensagemProgressiva,
          regiaoCodigo: freteGratis.regiaoCodigo,
          transportadoraCodigo: freteGratis.transportadoraCodigo,
          servicoCodigo: freteGratis.servicoCodigo,
          criadoEm: agora,
        })),
      );
    }
  });

  revalidatePath("/admin/marketing/promocoes");

  return { success: true };
}
