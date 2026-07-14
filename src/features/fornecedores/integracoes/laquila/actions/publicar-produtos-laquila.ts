"use server";

import { revalidatePath } from "next/cache";

import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

import { publicarProdutosLaquilaSchema } from "../schemas/publicacao-laquila.schema";
import { publicarProdutoRascunhoLaquila } from "../services/publicar-produto-rascunho-laquila.service";

type ItemPublicadoLaquila = {
  rascunhoId: string;
  produtoId: string;
  varianteTecnicaId: string | null;
  slug: string;
  sku: string;
};

export async function publicarProdutosLaquila(entrada: unknown) {
  const validacao = publicarProdutosLaquilaSchema.safeParse(entrada);

  if (!validacao.success) {
    return {
      sucesso: false,
      erro:
        validacao.error.issues[0]?.message ??
        "Selecione ao menos um rascunho para publicar.",
      publicados: [] as ItemPublicadoLaquila[],
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão expirou. Entre novamente para publicar produtos.",
      publicados: [] as ItemPublicadoLaquila[],
    };
  }

  const publicados: ItemPublicadoLaquila[] = [];
  const erros: Array<{ rascunhoId: string; erro: string }> = [];

  for (const rascunhoId of validacao.data.rascunhoIds) {
    try {
      publicados.push(await publicarProdutoRascunhoLaquila(rascunhoId));
    } catch (erro) {
      erros.push({
        rascunhoId,
        erro: erro instanceof Error ? erro.message : "Erro desconhecido.",
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/fornecedores/integracoes/laquila/conciliacao");
  revalidatePath("/admin/fornecedores/integracoes/laquila/publicacao");
  revalidatePath("/");

  if (publicados.length === 0) {
    return {
      sucesso: false,
      erro:
        erros[0]?.erro ?? "Não foi possível publicar os produtos selecionados.",
      publicados,
      erros,
    };
  }

  return {
    sucesso: erros.length === 0,
    mensagem:
      erros.length === 0
        ? `${publicados.length} produto${publicados.length === 1 ? " publicado" : "s publicados"} com sucesso.`
        : `${publicados.length} produto${publicados.length === 1 ? " publicado" : "s publicados"}; ${erros.length} não puderam ser publicados.`,
    erro:
      erros.length > 0
        ? "Alguns produtos possuem pendências. Revise os itens não publicados."
        : undefined,
    publicados,
    erros,
  };
}
