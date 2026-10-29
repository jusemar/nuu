import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  productAttributeTable,
  productPricingTable,
  productTable,
  productVariantTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import {
  administradoresFuncoesTable,
  administradoresPermissoesTable,
  administradoresTable,
  funcoesAdministrativasTable,
  funcoesPermissoesTable,
  permissoesAdministrativasTable,
} from "@/db/tables/autorizacao-admin";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoNoContexto } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { validarEstruturaProdutoRepresentante } from "../../lib/representantes/validar-estrutura-produto-representante";

export type TransacaoProdutosRepresentante = Parameters<
  Parameters<typeof dbTransacional.transaction>[0]
>[0];

/** Não é Server Action: callbacks/executores nunca podem ser enviados pelo navegador. */
export async function executarEscritaRepresentante<T>(
  recurso: { fornecedorId: string; produtoId?: string; versao?: string },
  gravar: (dados: {
    tx: TransacaoProdutosRepresentante;
    ator: { userId: string; administradorId: string };
    vinculoId: string;
    produto: typeof productTable.$inferSelect | null;
    varianteId: string | null;
  }) => Promise<T>,
) {
  const fornecedorId = z.uuid().parse(recurso.fornecedorId);
  const identidade = exigirPermissaoNoContexto(
    await obterContextoAdministrativo(),
    PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.ADMINISTRAR,
  );
  if (!identidade.representanteFornecedor || identidade.administradorPrincipal)
    throw new Error("Use o fluxo administrativo do gestor.");
  return dbTransacional.transaction(async (tx) => {
    // Locks SHARE protegem concessões/configuração contra alterações concorrentes.
    // O administrador fica serializado também com as ações RBAC que versionam seu vínculo.
    const [admin] = await tx
      .select()
      .from(administradoresTable)
      .where(eq(administradoresTable.id, identidade.administradorId))
      .for("update");
    if (
      !admin ||
      admin.status !== "ativo" ||
      admin.usuarioId !== identidade.userId
    )
      throw new Error("Acesso administrativo revogado.");
    await tx.select().from(permissoesAdministrativasTable).for("share");
    await tx.select().from(funcoesAdministrativasTable).for("share");
    await tx
      .select()
      .from(administradoresFuncoesTable)
      .where(eq(administradoresFuncoesTable.administradorId, admin.id))
      .for("share");
    await tx
      .select()
      .from(administradoresPermissoesTable)
      .where(eq(administradoresPermissoesTable.administradorId, admin.id))
      .for("share");
    await tx.select().from(funcoesPermissoesTable).for("share");
    const atual = exigirPermissaoNoContexto(
      await obterContextoAdministrativo(),
      PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.ADMINISTRAR,
    );
    if (
      atual.userId !== identidade.userId ||
      atual.administradorPrincipal ||
      !atual.representanteFornecedor
    )
      throw new Error("Identidade administrativa alterada.");
    const [fornecedor] = await tx
      .select()
      .from(fornecedoresTable)
      .where(eq(fornecedoresTable.id, fornecedorId))
      .for("update");
    if (fornecedor?.status !== "ativo")
      throw new Error("Fornecedor indisponível.");
    const [vinculo] = await tx
      .select()
      .from(representantesFornecedoresTable)
      .where(
        and(
          eq(representantesFornecedoresTable.usuarioId, identidade.userId),
          eq(representantesFornecedoresTable.fornecedorId, fornecedorId),
        ),
      )
      .for("update");
    if (!vinculo?.ativo) throw new Error("Vínculo com o fornecedor revogado.");
    let produto: typeof productTable.$inferSelect | null = null;
    let varianteId: string | null = null;
    if (recurso.produtoId) {
      const produtoId = z.uuid().parse(recurso.produtoId);
      const [autorizacao] = await tx
        .select()
        .from(autorizacoesProdutosRepresentantesTable)
        .where(
          and(
            eq(
              autorizacoesProdutosRepresentantesTable.representanteFornecedorId,
              vinculo.id,
            ),
            eq(autorizacoesProdutosRepresentantesTable.produtoId, produtoId),
          ),
        )
        .for("update");
      if (!autorizacao?.ativa)
        throw new Error("Acesso ao produto revogado ou indisponível.");
      [produto] = await tx
        .select()
        .from(productTable)
        .where(eq(productTable.id, produtoId))
        .for("update");
      if (!produto)
        throw new Error("Acesso ao produto revogado ou indisponível.");
      if (recurso.versao && produto.updatedAt.toISOString() !== recurso.versao)
        throw new Error(
          "O produto foi alterado. Atualize a página antes de salvar.",
        );
      const precos = await tx
        .select()
        .from(productPricingTable)
        .where(eq(productPricingTable.productId, produtoId))
        .for("update");
      const variantes = await tx
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, produtoId))
        .for("update");
      const atributos = await tx
        .select({ id: productAttributeTable.id })
        .from(productAttributeTable)
        .where(eq(productAttributeTable.productId, produtoId));
      varianteId = validarEstruturaProdutoRepresentante({
        produto,
        precos,
        variantes,
        quantidadeAtributos: atributos.length,
      });
    }
    return gravar({
      tx,
      ator: identidade,
      vinculoId: vinculo.id,
      produto,
      varianteId,
    });
  });
}
