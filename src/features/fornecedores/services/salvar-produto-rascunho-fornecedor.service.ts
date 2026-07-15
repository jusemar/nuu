import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { type NovoProdutoRascunho, produtoRascunhosTable } from "@/db/schema";

type DadosProdutoRascunhoFornecedor = Omit<
  NovoProdutoRascunho,
  "id" | "criadoEm" | "atualizadoEm"
> & {
  fornecedorId: string;
  codigoFornecedor: string;
  origemProvedor: string;
};

/**
 * Persiste o rascunho sem criar produto ou variante. Fornecedor + código de
 * origem identificam o mesmo item em novas revisões do fluxo.
 */
export async function salvarProdutoRascunhoFornecedor(
  dados: DadosProdutoRascunhoFornecedor,
) {
  const agora = new Date();
  const [existente] = await db
    .select({ id: produtoRascunhosTable.id })
    .from(produtoRascunhosTable)
    .where(
      and(
        eq(produtoRascunhosTable.origemTipo, dados.origemTipo),
        eq(produtoRascunhosTable.origemProvedor, dados.origemProvedor),
        eq(produtoRascunhosTable.fornecedorId, dados.fornecedorId),
        eq(
          produtoRascunhosTable.codigoFornecedor,
          dados.codigoFornecedor.trim(),
        ),
      ),
    )
    .limit(1);

  const valores = {
    ...dados,
    codigoFornecedor: dados.codigoFornecedor.trim(),
    atualizadoEm: agora,
  };

  const [rascunho] = existente
    ? await db
        .update(produtoRascunhosTable)
        .set(valores)
        .where(eq(produtoRascunhosTable.id, existente.id))
        .returning({ id: produtoRascunhosTable.id })
    : await db
        .insert(produtoRascunhosTable)
        .values({ ...valores, criadoEm: agora })
        .returning({ id: produtoRascunhosTable.id });

  return rascunho;
}
