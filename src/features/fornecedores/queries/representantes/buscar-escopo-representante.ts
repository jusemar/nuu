import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  representantesFornecedoresTable,
} from "@/db/schema";

/** Leitura interna. usuarioId deve vir exclusivamente da sessão resolvida no servidor. */
export async function buscarVinculosRepresentante(usuarioId: string) {
  const linhas = await db
    .select({
      id: representantesFornecedoresTable.id,
      usuarioId: representantesFornecedoresTable.usuarioId,
      fornecedorId: representantesFornecedoresTable.fornecedorId,
      ativo: representantesFornecedoresTable.ativo,
      statusFornecedor: fornecedoresTable.status,
    })
    .from(representantesFornecedoresTable)
    .innerJoin(
      fornecedoresTable,
      eq(fornecedoresTable.id, representantesFornecedoresTable.fornecedorId),
    )
    .where(eq(representantesFornecedoresTable.usuarioId, usuarioId));
  return linhas.map(({ statusFornecedor, ...vinculo }) => ({
    ...vinculo,
    fornecedorAtivo: statusFornecedor === "ativo",
  }));
}

/** A consulta amarra usuário + fornecedor + produto; IDs externos não ampliam o escopo. */
export async function buscarAutorizacoesProdutoRepresentante(
  usuarioId: string,
  fornecedorId: string,
  produtoId: string,
) {
  return db
    .select({
      representanteFornecedorId:
        autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
      produtoId: autorizacoesProdutosRepresentantesTable.produtoId,
      ativa: autorizacoesProdutosRepresentantesTable.ativa,
    })
    .from(autorizacoesProdutosRepresentantesTable)
    .innerJoin(
      representantesFornecedoresTable,
      eq(
        representantesFornecedoresTable.id,
        autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
      ),
    )
    .innerJoin(
      fornecedoresTable,
      eq(fornecedoresTable.id, representantesFornecedoresTable.fornecedorId),
    )
    .where(
      and(
        eq(representantesFornecedoresTable.usuarioId, usuarioId),
        eq(representantesFornecedoresTable.fornecedorId, fornecedorId),
        eq(representantesFornecedoresTable.ativo, true),
        eq(fornecedoresTable.status, "ativo"),
        eq(autorizacoesProdutosRepresentantesTable.produtoId, produtoId),
        eq(autorizacoesProdutosRepresentantesTable.ativa, true),
      ),
    );
}
