"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { bannersHomeTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { salvarBannerHomeSchema } from "../schemas/banner-home.schema";

function revalidarBannersHome() {
  revalidatePath("/");
  revalidatePath("/admin/configuracoes/banners-home");
}

export async function salvarBannerHome(data: unknown) {
  const dados = salvarBannerHomeSchema.parse(data);
  const agora = new Date();

  await dbTransacional.transaction(async (tx) => {
    if (dados.ativo && dados.posicao === "secundario_direito") {
      const condicaoMesmaPosicao = dados.id
        ? and(
            eq(bannersHomeTable.posicao, dados.posicao),
            eq(bannersHomeTable.ativo, true),
            ne(bannersHomeTable.id, dados.id),
          )
        : and(
            eq(bannersHomeTable.posicao, dados.posicao),
            eq(bannersHomeTable.ativo, true),
          );

      await tx
        .update(bannersHomeTable)
        .set({ ativo: false, updatedAt: agora })
        .where(condicaoMesmaPosicao);
    }

    const valores = {
      posicao: dados.posicao,
      tipoBanner: dados.tipoBanner,
      modeloSvg: dados.modeloSvg,
      variacaoVisual: dados.variacaoVisual,
      titulo: dados.titulo,
      subtitulo: dados.subtitulo,
      textoApoio: dados.textoApoio,
      precoChamada: dados.precoChamada,
      textoBotao: dados.textoBotao,
      linkBotao: dados.linkBotao,
      imagemUrl: dados.imagemUrl,
      imagemAlt: dados.imagemAlt,
      imagemMobileUrl: dados.imagemMobileUrl,
      focoImagem: dados.focoImagem,
      tamanhoImagem: dados.tamanhoImagem,
      metadataImagem: dados.metadataImagem ?? null,
      tipoDestaque: dados.tipoDestaque,
      ativo: dados.ativo,
      ordem: dados.ordem,
      updatedAt: agora,
    };

    if (dados.id) {
      await tx
        .update(bannersHomeTable)
        .set(valores)
        .where(eq(bannersHomeTable.id, dados.id));
      return;
    }

    await tx.insert(bannersHomeTable).values({
      ...valores,
      createdAt: agora,
    });
  });

  revalidarBannersHome();
  return { success: true };
}
