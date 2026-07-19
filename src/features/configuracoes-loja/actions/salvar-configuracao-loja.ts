"use server";

import { revalidatePath } from "next/cache";

import { configuracoesLojaTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { configuracaoLojaSchema } from "../schemas/configuracao-loja.schema";

const ID_CONFIGURACAO_GLOBAL = "global";

function revalidarPathSeguro(path: string, type?: "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (error) {
    console.warn("[configuracoes-loja:falha-revalidacao]", {
      tipo: error instanceof Error ? error.name : "Erro desconhecido",
    });
  }
}

export async function salvarConfiguracaoLoja(data: unknown) {
  const dados = configuracaoLojaSchema.parse(data);
  const nomeComercial = dados.nomeComercial.trim() || null;
  const agora = new Date();

  await dbTransacional
    .insert(configuracoesLojaTable)
    .values({
      id: ID_CONFIGURACAO_GLOBAL,
      nomeComercial,
      createdAt: agora,
      updatedAt: agora,
    })
    .onConflictDoUpdate({
      target: configuracoesLojaTable.id,
      set: { nomeComercial, updatedAt: agora },
    });

  revalidarPathSeguro("/admin/configuracoes/loja");
  revalidarPathSeguro("/product/[slug]", "page");

  return {
    success: true as const,
    message: "Configurações da loja salvas com sucesso.",
  };
}
