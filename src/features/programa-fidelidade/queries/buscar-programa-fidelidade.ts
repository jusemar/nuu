import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  categoryTable,
  configuracoesProgramaFidelidadeTable,
  regrasCategoriasProgramaFidelidadeTable,
} from "@/db/schema";

import { CONFIGURACAO_FIDELIDADE_INICIAL } from "../constants/dados-demonstracao";
import type {
  CategoriaFidelidade,
  EstadoProgramaFidelidade,
} from "../types/programa-fidelidade.types";

/** Carrega configuração e regras efetivas sem escrever ou criar dados implícitos. */
export async function buscarProgramaFidelidade(): Promise<
  EstadoProgramaFidelidade & { categorias: CategoriaFidelidade[] }
> {
  const [configuracoes, categoriasBanco] = await Promise.all([
    db.select().from(configuracoesProgramaFidelidadeTable).limit(1),
    db
      .select({
        id: categoryTable.id,
        nome: categoryTable.name,
        regraAtiva: regrasCategoriasProgramaFidelidadeTable.ativa,
        pontosPersonalizados:
          regrasCategoriasProgramaFidelidadeTable.pontosPorReal,
      })
      .from(categoryTable)
      .leftJoin(
        regrasCategoriasProgramaFidelidadeTable,
        eq(
          regrasCategoriasProgramaFidelidadeTable.categoriaId,
          categoryTable.id,
        ),
      )
      .where(eq(categoryTable.isActive, true))
      .orderBy(asc(categoryTable.name)),
  ]);

  const registro = configuracoes[0];
  const configuracao = registro
    ? {
        ativo: registro.ativo,
        nomePublico: registro.nomePublico,
        pontosPorReal: Number(registro.pontosPorReal),
        pontosConversao: Number(registro.pontosConversao),
        valorCredito: registro.valorCreditoEmCentavos / 100,
        minimoResgate: Number(registro.minimoPontosResgate),
        mesesValidade: registro.mesesValidade ?? 0,
      }
    : CONFIGURACAO_FIDELIDADE_INICIAL;

  const categorias = categoriasBanco.map((categoria, indice) => ({
    id: categoria.id,
    nome: categoria.nome,
    grupo: "Categoria da loja",
    // Estes dois campos alimentam somente métricas claramente marcadas como exemplo.
    produtos: 24 + ((indice * 37) % 180),
    ativa: categoria.regraAtiva ?? true,
    pontosUltimos30Dias: 5320 + ((indice * 7910) % 145000),
  }));

  return {
    categorias,
    configuracao,
    versao: registro?.versao ?? 1,
    regras: categoriasBanco.map((categoria) => ({
      categoriaId: categoria.id,
      personalizada: categoria.pontosPersonalizados !== null,
      pontosPorReal:
        categoria.pontosPersonalizados === null
          ? configuracao.pontosPorReal
          : Number(categoria.pontosPersonalizados),
      ativa: categoria.regraAtiva ?? true,
    })),
  };
}
