import "server-only";

import { and, eq, exists, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";

import { db } from "@/db/connection";
import {
  autorizacoesProdutosRepresentantesTable,
  fornecedoresTable,
  productTable,
  productVariantTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { ErroAutorizacaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/erros-autorizacao-admin";
import { exigirPermissaoNoContexto } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import type { ContextoAdministrativoAutorizado } from "@/features/autenticacao/types/autorizacao-admin.types";

/** A identidade vem sempre do servidor; representantes nunca usam o guard global. */
export async function exigirLeituraProdutosAdmin() {
  const contexto = await obterContextoAdministrativo();
  const representante =
    contexto.situacao === "ativo" &&
    !contexto.administradorPrincipal &&
    Boolean(contexto.representanteFornecedor);
  return exigirPermissaoNoContexto(
    contexto,
    representante
      ? PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.VISUALIZAR
      : PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR,
  );
}

/** Predicado reutilizável ANTES de busca, contagem, limite e carregamento de filhos. */
export function condicaoProdutoAdministrativo(
  contexto: ContextoAdministrativoAutorizado,
  produtoId: AnyPgColumn = productTable.id,
) {
  if (!contexto.representanteFornecedor || contexto.administradorPrincipal)
    return sql`true`;
  return exists(
    db
      .select({ id: autorizacoesProdutosRepresentantesTable.id })
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
          eq(autorizacoesProdutosRepresentantesTable.produtoId, produtoId),
          eq(autorizacoesProdutosRepresentantesTable.ativa, true),
          eq(representantesFornecedoresTable.usuarioId, contexto.userId),
          eq(representantesFornecedoresTable.ativo, true),
          eq(fornecedoresTable.status, "ativo"),
        ),
      ),
  );
}

export async function exigirLeituraProdutoAdmin(produtoIdEntrada: unknown) {
  const produtoId = z.uuid().parse(produtoIdEntrada);
  const contexto = await exigirLeituraProdutosAdmin();
  const [produto] = await db
    .select({ id: productTable.id })
    .from(productTable)
    .where(
      and(
        eq(productTable.id, produtoId),
        condicaoProdutoAdministrativo(contexto),
      ),
    )
    .limit(1);
  if (!produto) throw new ErroAutorizacaoAdmin("SEM_PERMISSAO");
  return { contexto, produtoId };
}

/** Resolve o pai no banco: o cliente não escolhe a qual produto a variante pertence. */
export async function exigirLeituraVarianteAdmin(varianteIdEntrada: unknown) {
  const varianteId = z.uuid().parse(varianteIdEntrada);
  const contexto = await exigirLeituraProdutosAdmin();
  const [variante] = await db
    .select({ produtoId: productVariantTable.productId })
    .from(productVariantTable)
    .where(
      and(
        eq(productVariantTable.id, varianteId),
        condicaoProdutoAdministrativo(contexto, productVariantTable.productId),
      ),
    )
    .limit(1);
  if (!variante) throw new ErroAutorizacaoAdmin("SEM_PERMISSAO");
  return { contexto, varianteId, produtoId: variante.produtoId };
}
