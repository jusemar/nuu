"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { productTable, produtosVendaCruzadaTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import { salvarVendaCruzadaSchema } from "../schemas/venda-cruzada.schema";
import type { ResultadoSalvarVendaCruzada } from "../types/venda-cruzada.types";

/**
 * Substitui toda a configuração em uma única transação. Uma validação que falhe
 * antes ou durante a gravação deixa a configuração anterior integralmente intacta.
 */
export async function salvarVendaCruzadaAdmin(
  entrada: unknown,
): Promise<ResultadoSalvarVendaCruzada> {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRODUTOS.ADMINISTRAR);

  const validacao = salvarVendaCruzadaSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const dados = validacao.data;

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      const idsConsultados = [dados.produtoPrincipalId, ...dados.produtosIds];
      const produtosExistentes = await tx
        .select({ id: productTable.id })
        .from(productTable)
        .where(inArray(productTable.id, idsConsultados));
      const idsExistentes = new Set(
        produtosExistentes.map((produto) => produto.id),
      );

      if (!idsExistentes.has(dados.produtoPrincipalId)) {
        return {
          sucesso: false as const,
          mensagem: "Produto principal não encontrado.",
        };
      }

      const idInexistente = dados.produtosIds.find(
        (id) => !idsExistentes.has(id),
      );
      if (idInexistente) {
        return {
          sucesso: false as const,
          mensagem: "Um dos produtos selecionados não existe mais no catálogo.",
        };
      }

      await tx
        .update(productTable)
        .set({ vendaCruzadaAtiva: dados.ativa, updatedAt: new Date() })
        .where(eq(productTable.id, dados.produtoPrincipalId));

      await tx
        .delete(produtosVendaCruzadaTable)
        .where(
          eq(
            produtosVendaCruzadaTable.produtoPrincipalId,
            dados.produtoPrincipalId,
          ),
        );

      if (dados.produtosIds.length > 0) {
        await tx.insert(produtosVendaCruzadaTable).values(
          dados.produtosIds.map((produtoOferecidoId, ordem) => ({
            produtoPrincipalId: dados.produtoPrincipalId,
            produtoOferecidoId,
            ordem,
          })),
        );
      }

      return { sucesso: true as const };
    });

    if (!resultado.sucesso) return resultado;

    revalidatePath(`/admin/products/${dados.produtoPrincipalId}/edit`);
    return { sucesso: true, mensagem: "Configuração de venda cruzada salva." };
  } catch (erro) {
    console.error("[venda-cruzada:salvar]", {
      tipo: erro instanceof Error ? erro.name : "Erro desconhecido",
    });
    return {
      sucesso: false,
      mensagem: "Não foi possível salvar a venda cruzada. Tente novamente.",
    };
  }
}
