"use server";

import { z } from "zod";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { podeAdmin } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";
import {
  exigirPermissaoAdmin,
  obterContextoAdministrativo,
} from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { buscarCadeiaCategoriasFreteExterno } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-externo";
import type { CategoriaCadeiaFreteExterno } from "@/features/logistica/types/disponibilidade-frete-externo";

/**
 * Cadeia de categorias (da informada até a raiz) com o modo do Frete Externo.
 * O Admin aplica sobre ela a mesma regra pura usada pela loja
 * (`resolverDisponibilidadeFreteExterno`), inclusive antes de salvar.
 *
 * Usada no Produto e na Categoria: basta visualizar produtos OU categorias.
 */
export async function buscarCadeiaFreteExternoAdmin(
  categoriaId: string | null,
): Promise<CategoriaCadeiaFreteExterno[]> {
  const contexto = await obterContextoAdministrativo();
  if (
    !podeAdmin(contexto, PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR) &&
    !podeAdmin(contexto, PERMISSOES_ADMIN.CATEGORIAS.VISUALIZAR)
  ) {
    await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.VISUALIZAR);
  }

  const id = z.string().uuid().nullable().safeParse(categoriaId);
  if (!id.success || !id.data) return [];

  return buscarCadeiaCategoriasFreteExterno(id.data);
}
