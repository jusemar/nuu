import { and, eq, inArray } from "drizzle-orm";

import { categoryTable, marcaTable, produtoRascunhosTable } from "@/db/schema";
import { db } from "@/db/connection";
import {
  type ModalidadeComercialRascunho,
  listarPendenciasRascunhoFornecedor,
  mesclarDadosComerciaisRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";

type EntradaAtualizarCamposRascunhosFornecedor = {
  rascunhoIds: string[];
  origemProvedor: string;
} & (
  | { campo: "categoria"; categoriaId: string }
  | { campo: "marca"; marcaId: string }
  | { campo: "preco_loja"; precoLoja: number }
  | { campo: "secoes_loja"; secoesLoja: string[] }
  | {
      campo: "modalidade_comercial";
      modalidade: ModalidadeComercialRascunho;
    }
  | { campo: "prazo_entrega"; prazoEntrega: string }
);

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export async function atualizarCamposProdutosRascunhosFornecedor(
  entrada: EntradaAtualizarCamposRascunhosFornecedor,
) {
  const filtroRascunhos = and(
    inArray(produtoRascunhosTable.id, entrada.rascunhoIds),
    eq(produtoRascunhosTable.origemProvedor, entrada.origemProvedor),
  );
  const agora = new Date();

  if (entrada.campo === "categoria") {
    const [categoria] = await db
      .select({ id: categoryTable.id })
      .from(categoryTable)
      .where(eq(categoryTable.id, entrada.categoriaId))
      .limit(1);

    if (!categoria) throw new Error("Categoria não encontrada.");

    await db
      .update(produtoRascunhosTable)
      .set({ categoriaId: categoria.id, atualizadoEm: agora })
      .where(filtroRascunhos);
  } else if (entrada.campo === "marca") {
    const [marca] = await db
      .select({ id: marcaTable.id })
      .from(marcaTable)
      .where(eq(marcaTable.id, entrada.marcaId))
      .limit(1);

    if (!marca) throw new Error("Marca não encontrada.");

    await db
      .update(produtoRascunhosTable)
      .set({ marcaId: marca.id, atualizadoEm: agora })
      .where(filtroRascunhos);
  } else if (entrada.campo === "preco_loja") {
    await db
      .update(produtoRascunhosTable)
      .set({ precoLoja: entrada.precoLoja.toFixed(2), atualizadoEm: agora })
      .where(filtroRascunhos);
  } else {
    const rascunhos = await db
      .select({
        id: produtoRascunhosTable.id,
        dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
      })
      .from(produtoRascunhosTable)
      .where(filtroRascunhos);

    // O driver Neon HTTP não oferece transações. Cada atualização preserva o
    // JSON atual e permanece restrita aos IDs previamente validados.
    for (const rascunho of rascunhos) {
      const dadosOrigemJson = ehRegistro(rascunho.dadosOrigemJson)
        ? rascunho.dadosOrigemJson
        : {};
      const dadosAtualizados = mesclarDadosComerciaisRascunhoFornecedor({
        dadosOrigemJson,
        ...(entrada.campo === "secoes_loja"
          ? { secoesLoja: entrada.secoesLoja }
          : {}),
        ...(entrada.campo === "modalidade_comercial"
          ? { modalidade: entrada.modalidade }
          : {}),
        ...(entrada.campo === "prazo_entrega"
          ? { prazoEntrega: entrada.prazoEntrega }
          : {}),
      });

      await db
        .update(produtoRascunhosTable)
        .set({ dadosOrigemJson: dadosAtualizados, atualizadoEm: agora })
        .where(eq(produtoRascunhosTable.id, rascunho.id));
    }
  }

  const atualizados = await db
    .select({
      id: produtoRascunhosTable.id,
      nome: produtoRascunhosTable.nome,
      categoriaId: produtoRascunhosTable.categoriaId,
      marcaId: produtoRascunhosTable.marcaId,
      precoLoja: produtoRascunhosTable.precoLoja,
      dadosOrigemJson: produtoRascunhosTable.dadosOrigemJson,
    })
    .from(produtoRascunhosTable)
    .where(filtroRascunhos);

  for (const rascunho of atualizados) {
    const pendencias = listarPendenciasRascunhoFornecedor(rascunho);
    await db
      .update(produtoRascunhosTable)
      .set({
        status:
          pendencias.length === 0
            ? "pronto_para_publicar"
            : "pendente_conciliacao",
        atualizadoEm: agora,
      })
      .where(eq(produtoRascunhosTable.id, rascunho.id));
  }

  return atualizados.map(({ id }) => ({ id }));
}
