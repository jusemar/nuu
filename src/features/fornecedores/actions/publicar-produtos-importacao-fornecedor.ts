"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/connection";
import { produtoRascunhosTable } from "@/db/schema";
import { possuiSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import { buscarOrigemImportacaoFornecedor } from "@/features/fornecedores/queries/buscar-origem-importacao-fornecedor";
import { publicarProdutoRascunhoFornecedor } from "@/features/fornecedores/services/publicar-produto-rascunho-fornecedor.service";

const publicarProdutosImportacaoFornecedorSchema = z.object({
  rascunhoIds: z.array(z.uuid()).min(1).max(50),
});

type ItemPublicadoImportacaoFornecedor = {
  rascunhoId: string;
  produtoId: string;
  varianteTecnicaId: string | null;
  slug: string;
  sku: string;
};

export async function publicarProdutosImportacaoFornecedor(
  importacaoId: string,
  entrada: unknown,
) {
  const idValidado = z.uuid().safeParse(importacaoId);
  const validacao =
    publicarProdutosImportacaoFornecedorSchema.safeParse(entrada);

  if (!idValidado.success || !validacao.success) {
    return {
      sucesso: false,
      erro: "Selecione ao menos um rascunho válido para publicar.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  if (!(await possuiSessaoFornecedoresAdmin())) {
    return {
      sucesso: false,
      erro: "Sua sessão expirou. Entre novamente para publicar produtos.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  // A origem vem da própria importação: a publicação é a mesma etapa para
  // arquivo e API, e só o par (origem_tipo, origem_provedor) muda.
  const origem = await buscarOrigemImportacaoFornecedor(idValidado.data);

  if (!origem) {
    return {
      sucesso: false,
      erro: "Importação não encontrada.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  const idsUnicos = Array.from(new Set(validacao.data.rascunhoIds));
  const rascunhosPermitidos = await db
    .select({ id: produtoRascunhosTable.id })
    .from(produtoRascunhosTable)
    .where(
      and(
        inArray(produtoRascunhosTable.id, idsUnicos),
        eq(produtoRascunhosTable.origemTipo, origem.origemTipo),
        eq(produtoRascunhosTable.origemProvedor, origem.origemProvedor),
        eq(produtoRascunhosTable.status, "pronto_para_publicar"),
        sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${idValidado.data}`,
      ),
    );

  if (rascunhosPermitidos.length !== idsUnicos.length) {
    return {
      sucesso: false,
      erro: "Um ou mais rascunhos não pertencem à importação ou ainda possuem pendências.",
      publicados: [] as ItemPublicadoImportacaoFornecedor[],
    };
  }

  const publicados: ItemPublicadoImportacaoFornecedor[] = [];
  const erros: Array<{ rascunhoId: string; erro: string }> = [];

  for (const rascunhoId of idsUnicos) {
    try {
      publicados.push(
        await publicarProdutoRascunhoFornecedor(rascunhoId, {
          origemTipo: origem.origemTipo,
          origemProvedor: origem.origemProvedor,
          importacaoId: idValidado.data,
          nomeOrigem: "da importação",
        }),
      );
    } catch (erro) {
      erros.push({
        rascunhoId,
        erro: erro instanceof Error ? erro.message : "Erro desconhecido.",
      });
    }
  }

  // Publicação que não invalida nada não chega ao cliente.
  //
  // A escrita no banco sempre esteve certa, mas a vitrine continuava servindo a
  // versão em cache de rota do Next: o gestor abria a PDP e via o preço antigo,
  // concluindo — com razão — que "o produto não foi atualizado". A PDP de cada
  // produto publicado é o caminho que faltava, e o `slug` já vem do service,
  // sem custo de consulta extra.
  if (publicados.length > 0) {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/fornecedores/importacoes/${idValidado.data}`);
    revalidatePath(
      `/admin/fornecedores/importacoes/${idValidado.data}/publicacao`,
    );
    revalidatePath(
      `/admin/fornecedores/integracoes/laquila/importacoes/${idValidado.data}/conciliacao`,
    );
    revalidatePath(
      `/admin/fornecedores/integracoes/laquila/importacoes/${idValidado.data}/publicacao`,
    );
    revalidatePath("/");

    for (const item of publicados) {
      revalidatePath(`/product/${item.slug}`);
      revalidatePath(`/admin/products/${item.produtoId}/edit`);
    }
  }

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
