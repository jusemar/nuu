import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedoresTable,
  representantesFornecedoresTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import {
  exigirPermissaoNoContexto,
  podeAdmin,
} from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import { obterContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import type { PerfilProdutosAdmin } from "../../types/representantes/produto-representante.types";

export async function buscarPerfilProdutosAdmin(): Promise<PerfilProdutosAdmin> {
  const contexto = await obterContextoAdministrativo();
  if (contexto.situacao !== "ativo")
    throw new Error("Sessão administrativa indisponível.");
  const representante = Boolean(
    contexto.representanteFornecedor && !contexto.administradorPrincipal,
  );
  if (!representante)
    return {
      representante: false,
      principal: contexto.administradorPrincipal,
      podeEscrever: false,
      fornecedores: [],
    };
  exigirPermissaoNoContexto(
    contexto,
    PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.VISUALIZAR,
  );
  const fornecedores = await db
    .select({ id: fornecedoresTable.id, nome: fornecedoresTable.nome })
    .from(representantesFornecedoresTable)
    .innerJoin(
      fornecedoresTable,
      eq(fornecedoresTable.id, representantesFornecedoresTable.fornecedorId),
    )
    .where(
      and(
        eq(representantesFornecedoresTable.usuarioId, contexto.userId),
        eq(representantesFornecedoresTable.ativo, true),
        eq(fornecedoresTable.status, "ativo"),
      ),
    )
    .orderBy(fornecedoresTable.nome, fornecedoresTable.id);
  return {
    representante: true,
    principal: false,
    podeEscrever: podeAdmin(
      contexto,
      PERMISSOES_ADMIN.REPRESENTANTES_PRODUTOS.ADMINISTRAR,
    ),
    fornecedores,
  };
}
