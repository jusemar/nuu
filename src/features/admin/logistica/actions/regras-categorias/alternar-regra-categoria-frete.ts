"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { regrasCategoriasFreteTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function alternarRegraCategoriaFrete(
  regraCategoriaFreteId: string,
  ativo: boolean,
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  if (!regraCategoriaFreteId) {
    return { sucesso: false as const, erro: "ID da regra é obrigatório" };
  }

  try {
    const [registro] = await db
      .update(regrasCategoriasFreteTable)
      .set({ ativo, updatedAt: new Date() })
      .where(eq(regrasCategoriasFreteTable.id, regraCategoriaFreteId))
      .returning({
        id: regrasCategoriasFreteTable.id,
        ativo: regrasCategoriasFreteTable.ativo,
      });

    if (!registro)
      return { sucesso: false as const, erro: "Regra não encontrada" };

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: registro };
  } catch (erro) {
    console.error("[alternarRegraCategoriaFrete]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao alternar regra por categoria",
    };
  }
}
