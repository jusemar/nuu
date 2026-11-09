import "server-only";

import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  administradoresFuncoesTable,
  administradoresTable,
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  fornecedorProdutoVinculosTable,
  funcoesAdministrativasTable,
  productTable,
  representantesFornecedoresTable,
  userTable,
} from "@/db/schema";

import { exigirGestorRepresentantes } from "./exigir-gestor-representantes";

/** Leituras da gestão ficam restritas ao gestor principal e separadas das mutações. */
export async function listarGestaoRepresentantes(
  fornecedorId?: string,
  usuarioId?: string,
  paginaEntrada = 1,
) {
  await exigirGestorRepresentantes();
  const [fornecedores, representantes] = await Promise.all([
    db
      .select({
        id: fornecedoresTable.id,
        nome: fornecedoresTable.nome,
        status: fornecedoresTable.status,
      })
      .from(fornecedoresTable)
      .orderBy(asc(fornecedoresTable.nome)),
    db
      .select({
        id: userTable.id,
        nome: userTable.name,
        email: userTable.email,
      })
      .from(userTable)
      .innerJoin(
        administradoresTable,
        eq(administradoresTable.usuarioId, userTable.id),
      )
      .innerJoin(
        administradoresFuncoesTable,
        eq(
          administradoresFuncoesTable.administradorId,
          administradoresTable.id,
        ),
      )
      .innerJoin(
        funcoesAdministrativasTable,
        eq(
          funcoesAdministrativasTable.id,
          administradoresFuncoesTable.funcaoId,
        ),
      )
      .where(
        and(
          eq(administradoresTable.status, "ativo"),
          eq(funcoesAdministrativasTable.chave, "representante_fornecedor"),
          eq(funcoesAdministrativasTable.status, "ativa"),
        ),
      )
      .orderBy(asc(userTable.name)),
  ]);
  const fornecedorSelecionado =
    fornecedores.find((item) => item.id === fornecedorId) ?? null;
  const representanteSelecionado =
    representantes.find((item) => item.id === usuarioId) ?? null;
  const vinculos = fornecedorSelecionado
    ? await db
        .select({
          id: representantesFornecedoresTable.id,
          usuarioId: representantesFornecedoresTable.usuarioId,
          ativo: representantesFornecedoresTable.ativo,
        })
        .from(representantesFornecedoresTable)
        .where(
          eq(
            representantesFornecedoresTable.fornecedorId,
            fornecedorSelecionado.id,
          ),
        )
    : [];
  const vinculo =
    vinculos.find((item) => item.usuarioId === representanteSelecionado?.id) ??
    null;
  const pagina =
    Number.isSafeInteger(paginaEntrada) && paginaEntrada > 0
      ? paginaEntrada
      : 1;
  const [{ total }] = fornecedorSelecionado
    ? await db
        .select({ total: count() })
        .from(fornecedorProdutoVinculosTable)
        .where(
          and(
            eq(
              fornecedorProdutoVinculosTable.fornecedorId,
              fornecedorSelecionado.id,
            ),
            eq(fornecedorProdutoVinculosTable.status, "ativo"),
          ),
        )
    : [{ total: 0 }];
  const produtos = fornecedorSelecionado
    ? await db
        .select({
          id: productTable.id,
          nome: productTable.name,
          sku: productTable.sku,
          codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
        })
        .from(fornecedorProdutoVinculosTable)
        .innerJoin(
          productTable,
          eq(productTable.id, fornecedorProdutoVinculosTable.produtoId),
        )
        .where(
          and(
            eq(
              fornecedorProdutoVinculosTable.fornecedorId,
              fornecedorSelecionado.id,
            ),
            eq(fornecedorProdutoVinculosTable.status, "ativo"),
          ),
        )
        .orderBy(asc(productTable.name))
        .limit(20)
        .offset((pagina - 1) * 20)
    : [];
  const autorizacoes = vinculo
    ? await db
        .select({
          produtoId: autorizacoesProdutosRepresentantesTable.produtoId,
          ativa: autorizacoesProdutosRepresentantesTable.ativa,
        })
        .from(autorizacoesProdutosRepresentantesTable)
        .where(
          eq(
            autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
            vinculo.id,
          ),
        )
    : [];
  return {
    fornecedores,
    representantes,
    fornecedorSelecionado,
    representanteSelecionado,
    vinculos,
    vinculo,
    produtos,
    pagina,
    totalPaginas: Math.ceil(total / 20),
    autorizacoes: Object.fromEntries(
      autorizacoes.map((item) => [item.produtoId, item.ativa]),
    ),
  };
}
