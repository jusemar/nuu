import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  representantesFornecedoresTable,
  userTable,
} from "@/db/schema";
import { exigirGestorRepresentantes } from "@/features/fornecedores/queries/representantes/exigir-gestor-representantes";

export async function buscarComissoesProdutoGestor(produtoId: unknown) {
  await exigirGestorRepresentantes();
  const id = z.uuid().parse(produtoId);
  return db
    .select({
      id: autorizacoesProdutosRepresentantesTable.id,
      nome: userTable.name,
      fornecedor: fornecedoresTable.nome,
      ativa: autorizacoesProdutosRepresentantesTable.ativa,
      tipo: autorizacoesProdutosRepresentantesTable.comissaoTipo,
      valor: autorizacoesProdutosRepresentantesTable.comissaoValor,
      visivel: autorizacoesProdutosRepresentantesTable.comissaoVisivel,
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
      userTable,
      eq(userTable.id, representantesFornecedoresTable.usuarioId),
    )
    .innerJoin(
      fornecedoresTable,
      eq(fornecedoresTable.id, representantesFornecedoresTable.fornecedorId),
    )
    .where(eq(autorizacoesProdutosRepresentantesTable.produtoId, id))
    .orderBy(userTable.name, autorizacoesProdutosRepresentantesTable.id);
}
