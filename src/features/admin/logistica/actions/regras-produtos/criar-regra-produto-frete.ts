"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import { regrasProdutosFreteTable } from "@/db/schema";
import { criarRegraProdutoFreteSchema } from "@/features/admin/logistica/schemas/regras-produtos-frete-admin.schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

export async function criarRegraProdutoFrete(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const validacao = criarRegraProdutoFreteSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues.map((erro) => erro.message).join(", "),
    };
  }

  try {
    const [registro] = await db
      .insert(regrasProdutosFreteTable)
      .values(validacao.data)
      .returning({ id: regrasProdutosFreteTable.id });

    revalidatePath("/admin/logistica/transportadoras-integracoes");
    return { sucesso: true as const, dados: { id: registro.id } };
  } catch (erro) {
    console.error("[criarRegraProdutoFrete]", erro);
    return {
      sucesso: false as const,
      erro: "Falha ao criar regra por produto",
    };
  }
}
