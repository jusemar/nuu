"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  categoryTable,
  configuracoesProgramaFidelidadeTable,
  regrasCategoriasProgramaFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

import { prepararOverridesCategorias } from "../lib/preparar-overrides-categorias";
import { salvarProgramaFidelidadeSchema } from "../schemas/salvar-programa-fidelidade.schema";
import type { EstadoProgramaFidelidade } from "../types/programa-fidelidade.types";

type ResultadoSalvar =
  | ({ sucesso: true; mensagem: string } & EstadoProgramaFidelidade)
  | { sucesso: false; mensagem: string };

export async function salvarProgramaFidelidade(
  entrada: unknown,
): Promise<ResultadoSalvar> {
  const sessao = await buscarSessaoAdmin();
  if (!sessao.autorizado) {
    return {
      sucesso: false,
      mensagem: "Sessão de administrador inválida ou expirada.",
    };
  }

  const validacao = salvarProgramaFidelidadeSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false,
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const dados = validacao.data;
  const idsCategorias = dados.regras.map((regra) => regra.categoriaId);

  try {
    const resultado = await dbTransacional.transaction(async (tx) => {
      if (idsCategorias.length > 0) {
        const categorias = await tx
          .select({ id: categoryTable.id })
          .from(categoryTable)
          .where(inArray(categoryTable.id, idsCategorias));

        if (categorias.length !== idsCategorias.length) {
          return {
            sucesso: false as const,
            mensagem:
              "Uma categoria não existe mais. Recarregue a página e tente novamente.",
          };
        }
      }

      const agora = new Date();
      const valoresConfiguracao = {
        ativo: dados.configuracao.ativo,
        nomePublico: dados.configuracao.nomePublico,
        pontosPorReal: String(dados.configuracao.pontosPorReal),
        pontosConversao: String(dados.configuracao.pontosConversao),
        valorCreditoEmCentavos: Math.round(
          dados.configuracao.valorCredito * 100,
        ),
        minimoPontosResgate: String(dados.configuracao.minimoResgate),
        mesesValidade:
          dados.configuracao.mesesValidade === 0
            ? null
            : dados.configuracao.mesesValidade,
        updatedAt: agora,
      };

      const [existente] = await tx
        .select({ versao: configuracoesProgramaFidelidadeTable.versao })
        .from(configuracoesProgramaFidelidadeTable)
        .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
        .limit(1);

      let novaVersao: number;
      if (!existente) {
        if (dados.versao !== 1) {
          return {
            sucesso: false as const,
            mensagem: "A configuração foi alterada. Recarregue a página.",
          };
        }
        novaVersao = 2;
        await tx.insert(configuracoesProgramaFidelidadeTable).values({
          id: "global",
          ...valoresConfiguracao,
          versao: novaVersao,
          createdAt: agora,
        });
      } else {
        const [atualizada] = await tx
          .update(configuracoesProgramaFidelidadeTable)
          .set({ ...valoresConfiguracao, versao: dados.versao + 1 })
          .where(
            and(
              eq(configuracoesProgramaFidelidadeTable.id, "global"),
              eq(configuracoesProgramaFidelidadeTable.versao, dados.versao),
            ),
          )
          .returning({ versao: configuracoesProgramaFidelidadeTable.versao });

        if (!atualizada) {
          return {
            sucesso: false as const,
            mensagem:
              "A configuração foi alterada em outra sessão. Recarregue a página.",
          };
        }
        novaVersao = atualizada.versao;
      }

      if (idsCategorias.length > 0) {
        await tx
          .delete(regrasCategoriasProgramaFidelidadeTable)
          .where(
            inArray(
              regrasCategoriasProgramaFidelidadeTable.categoriaId,
              idsCategorias,
            ),
          );
      }

      const overrides = prepararOverridesCategorias(dados.regras);
      if (overrides.length > 0) {
        await tx.insert(regrasCategoriasProgramaFidelidadeTable).values(
          overrides.map((regra) => ({
            categoriaId: regra.categoriaId,
            ativa: regra.ativa,
            pontosPorReal: regra.pontosPorReal,
            createdAt: agora,
            updatedAt: agora,
          })),
        );
      }

      return { sucesso: true as const, novaVersao };
    });

    if (!resultado.sucesso) return resultado;

    revalidatePath("/admin/marketing/programa-fidelidade");
    return {
      sucesso: true,
      mensagem: "Configurações do programa salvas com sucesso.",
      configuracao: dados.configuracao,
      regras: dados.regras.map((regra) => ({
        ...regra,
        pontosPorReal: regra.personalizada
          ? regra.pontosPorReal
          : dados.configuracao.pontosPorReal,
      })),
      versao: resultado.novaVersao,
    };
  } catch (erro) {
    console.error("[programa-fidelidade:salvar]", {
      tipo: erro instanceof Error ? erro.name : "Erro desconhecido",
    });
    return {
      sucesso: false,
      mensagem: "Não foi possível salvar as configurações. Tente novamente.",
    };
  }
}
