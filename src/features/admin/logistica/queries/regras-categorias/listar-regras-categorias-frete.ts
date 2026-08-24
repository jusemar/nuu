import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  provedoresFreteTable,
  regrasCategoriasFreteTable,
  servicosFreteTable,
  transportadorasFreteTable,
} from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function listarRegrasCategoriasFrete() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  return db
    .select({
      id: regrasCategoriasFreteTable.id,
      categoriaId: regrasCategoriasFreteTable.categoriaId,
      categoriaNome: categoryTable.name,
      efeito: regrasCategoriasFreteTable.efeito,
      ativo: regrasCategoriasFreteTable.ativo,
      provedorFreteId: regrasCategoriasFreteTable.provedorFreteId,
      provedorNome: provedoresFreteTable.nome,
      transportadoraFreteId: regrasCategoriasFreteTable.transportadoraFreteId,
      transportadoraNome: transportadorasFreteTable.nome,
      servicoFreteId: regrasCategoriasFreteTable.servicoFreteId,
      servicoNome: servicosFreteTable.nome,
      createdAt: regrasCategoriasFreteTable.createdAt,
      updatedAt: regrasCategoriasFreteTable.updatedAt,
    })
    .from(regrasCategoriasFreteTable)
    .innerJoin(
      categoryTable,
      eq(regrasCategoriasFreteTable.categoriaId, categoryTable.id),
    )
    .leftJoin(
      provedoresFreteTable,
      eq(regrasCategoriasFreteTable.provedorFreteId, provedoresFreteTable.id),
    )
    .leftJoin(
      transportadorasFreteTable,
      eq(
        regrasCategoriasFreteTable.transportadoraFreteId,
        transportadorasFreteTable.id,
      ),
    )
    .leftJoin(
      servicosFreteTable,
      eq(regrasCategoriasFreteTable.servicoFreteId, servicosFreteTable.id),
    )
    .orderBy(
      asc(categoryTable.name),
      asc(regrasCategoriasFreteTable.createdAt),
    );
}
