"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { productGalleryImagesTable, productTable } from "@/db/schema";

import { recursoRepresentanteSchema } from "../../schemas/representantes/produto-representante.schema";
import { armazenarImagemRepresentante } from "./armazenar-imagem-produto";
import { executarEscritaRepresentante } from "./executar-escrita-representante";
import {
  auditarEscritaProduto,
  exigirVinculoComercialProduto,
} from "./persistir-produto-representante";
import { responderOperacaoProduto } from "./responder-operacao-produto";

export async function enviarImagemProdutoRepresentante(formulario: FormData) {
  return responderOperacaoProduto(async () => {
    if (
      [...formulario.keys()].some(
        (k) => !["fornecedorId", "produtoId", "arquivo"].includes(k),
      )
    )
      throw new Error("Campos de upload não permitidos.");
    const recurso = recursoRepresentanteSchema.parse({
      fornecedorId: formulario.get("fornecedorId"),
      produtoId: formulario.get("produtoId"),
    });
    const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size > 4 * 1024 * 1024)
      throw new Error("Envie uma imagem de até 4 MB.");
    let removerArquivo: (() => Promise<unknown>) | undefined;
    try {
      return await executarEscritaRepresentante(
        recurso,
        async ({ tx, ator }) => {
          await exigirVinculoComercialProduto(
            tx,
            recurso.fornecedorId,
            recurso.produtoId,
          );
          const imagens = await tx
            .select({ id: productGalleryImagesTable.id })
            .from(productGalleryImagesTable)
            .where(eq(productGalleryImagesTable.productId, recurso.produtoId));
          if (imagens.length >= 20)
            throw new Error("Limite de 20 imagens por produto.");
          const armazenamento = await armazenarImagemRepresentante(
            recurso.produtoId,
            new Uint8Array(await arquivo.arrayBuffer()),
            arquivo.type,
          );
          removerArquivo = armazenamento.excluir;
          const [imagem] = await tx
            .insert(productGalleryImagesTable)
            .values({
              productId: recurso.produtoId,
              imageUrl: armazenamento.url,
              altText: arquivo.name.slice(0, 200),
              sortOrder: imagens.length,
              isPrimary: imagens.length === 0,
            })
            .returning({ id: productGalleryImagesTable.id });
          await tx
            .update(productTable)
            .set({ updatedAt: new Date() })
            .where(eq(productTable.id, recurso.produtoId));
          await auditarEscritaProduto(
            tx,
            ator,
            recurso.produtoId,
            recurso.fornecedorId,
            "imagem_adicionada",
          );
          return imagem;
        },
      );
    } catch (erro) {
      await removerArquivo?.().catch(() => undefined);
      throw erro;
    }
  });
}
export async function alterarImagemProdutoRepresentante(entrada: unknown) {
  return responderOperacaoProduto(async () => {
    const dados = recursoRepresentanteSchema
      .extend({
        imagemId: z.uuid(),
        acao: z.enum(["remover", "principal", "subir", "descer"]),
      })
      .strict()
      .parse(entrada);
    return executarEscritaRepresentante(dados, async ({ tx, ator }) => {
      await exigirVinculoComercialProduto(
        tx,
        dados.fornecedorId,
        dados.produtoId,
      );
      const imagens = await tx
        .select()
        .from(productGalleryImagesTable)
        .where(eq(productGalleryImagesTable.productId, dados.produtoId))
        .orderBy(
          productGalleryImagesTable.sortOrder,
          productGalleryImagesTable.id,
        )
        .for("update");
      const indice = imagens.findIndex((i) => i.id === dados.imagemId);
      if (indice < 0) throw new Error("Imagem não autorizada.");
      if (dados.acao === "remover") {
        await tx
          .delete(productGalleryImagesTable)
          .where(
            and(
              eq(productGalleryImagesTable.id, dados.imagemId),
              eq(productGalleryImagesTable.productId, dados.produtoId),
            ),
          );
        imagens.splice(indice, 1);
        if (imagens.length && !imagens.some((i) => i.isPrimary))
          imagens[0].isPrimary = true;
      } else if (dados.acao === "principal")
        imagens.forEach((i) => {
          i.isPrimary = i.id === dados.imagemId;
        });
      else {
        const destino = indice + (dados.acao === "subir" ? -1 : 1);
        if (destino >= 0 && destino < imagens.length)
          [imagens[indice], imagens[destino]] = [
            imagens[destino],
            imagens[indice],
          ];
      }
      for (const [ordem, imagem] of imagens.entries())
        await tx
          .update(productGalleryImagesTable)
          .set({ sortOrder: ordem, isPrimary: imagem.isPrimary })
          .where(eq(productGalleryImagesTable.id, imagem.id));
      await tx
        .update(productTable)
        .set({ updatedAt: new Date() })
        .where(eq(productTable.id, dados.produtoId));
      await auditarEscritaProduto(
        tx,
        ator,
        dados.produtoId,
        dados.fornecedorId,
        `imagem_${dados.acao}`,
      );
      return { id: dados.imagemId };
    });
  });
}
