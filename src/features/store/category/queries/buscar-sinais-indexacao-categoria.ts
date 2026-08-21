import "server-only";

import { and, inArray } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";

import { buscarArvoreCategoriaPublica } from "./buscar-arvore-categoria-publica";
import { buscarFaqsPublicasCategoria } from "./buscar-faqs-publicas-categoria";
import { condicaoProdutoPublicoCategoria } from "./condicao-produto-publico-categoria";

export const buscarSinaisIndexacaoCategoria = cache(
  async (categoriaId: string) => {
    const [arvore, faqs] = await Promise.all([
      buscarArvoreCategoriaPublica(categoriaId),
      buscarFaqsPublicasCategoria(categoriaId),
    ]);
    const ids = arvore.map((categoria) => categoria.id);
    const [produtoPublico] = ids.length
      ? await db
          .select({ id: productTable.id })
          .from(productTable)
          .where(
            and(
              inArray(productTable.categoryId, ids),
              condicaoProdutoPublicoCategoria(),
            ),
          )
          .limit(1)
      : [];

    return {
      faqs: faqs.map((faq) => ({
        question: faq.pergunta,
        answer: faq.resposta,
      })),
      temProdutoPublico: Boolean(produtoPublico),
    };
  },
);
