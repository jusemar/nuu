import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { type NovoProdutoRascunho, produtoRascunhosTable } from "@/db/schema";

type DadosProdutoRascunhoFornecedor = Omit<
  NovoProdutoRascunho,
  "id" | "criadoEm" | "atualizadoEm"
> & {
  fornecedorId: string;
  codigoFornecedor: string;
  origemProvedor: string;
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Importação dona deste rascunho, quando o chamador informa uma. */
function extrairImportacaoId(dadosOrigemJson: unknown) {
  if (!ehRegistro(dadosOrigemJson)) return null;
  const origem = dadosOrigemJson.origemFluxoFornecedor;
  if (!ehRegistro(origem) || typeof origem.importacaoId !== "string") {
    return null;
  }
  return origem.importacaoId;
}

/**
 * Persiste o rascunho sem criar produto ou variante. Fornecedor + código de
 * origem identificam o mesmo item em novas revisões do fluxo.
 *
 * Duas proteções nascem aqui, e as duas vêm de bugs reais:
 *
 * 1. **A importação faz parte da identidade.** Sem ela, carregar amanhã o mesmo
 *    arquivo do mesmo fornecedor encontrava o rascunho da importação de ontem e
 *    o sobrescrevia — inclusive o `importacaoId` gravado em `dadosOrigemJson`.
 *    O ciclo antigo perdia o item para o novo, e o histórico deixava de fechar.
 *    Quem não informa importação (a integração contínua da Laquila) mantém o
 *    comportamento global de propósito: lá existe um rascunho por código, não
 *    um por execução.
 *
 * 2. **`publicado` é estado terminal.** Voltar para a Vinculação e mandar os
 *    itens para a Conciliação de novo reescrevia o rascunho já publicado de
 *    volta para `pendente_conciliacao`, e o produto ressuscitava na fila. Um
 *    item publicado não é mais tocado por este caminho.
 */
export async function salvarProdutoRascunhoFornecedor(
  dados: DadosProdutoRascunhoFornecedor,
) {
  const agora = new Date();
  const importacaoId = extrairImportacaoId(dados.dadosOrigemJson);

  const [existente] = await db
    .select({
      id: produtoRascunhosTable.id,
      status: produtoRascunhosTable.status,
    })
    .from(produtoRascunhosTable)
    .where(
      and(
        eq(produtoRascunhosTable.origemTipo, dados.origemTipo),
        eq(produtoRascunhosTable.origemProvedor, dados.origemProvedor),
        eq(produtoRascunhosTable.fornecedorId, dados.fornecedorId),
        eq(
          produtoRascunhosTable.codigoFornecedor,
          dados.codigoFornecedor.trim(),
        ),
        ...(importacaoId
          ? [
              sql`${produtoRascunhosTable.dadosOrigemJson}->'origemFluxoFornecedor'->>'importacaoId' = ${importacaoId}`,
            ]
          : []),
      ),
    )
    .limit(1);

  // Item já publicado não volta para a fila: devolve o registro como está.
  if (existente?.status === "publicado") {
    return { id: existente.id };
  }

  const valores = {
    ...dados,
    codigoFornecedor: dados.codigoFornecedor.trim(),
    atualizadoEm: agora,
  };

  const [rascunho] = existente
    ? await db
        .update(produtoRascunhosTable)
        .set(valores)
        .where(eq(produtoRascunhosTable.id, existente.id))
        .returning({ id: produtoRascunhosTable.id })
    : await db
        .insert(produtoRascunhosTable)
        .values({ ...valores, criadoEm: agora })
        .returning({ id: produtoRascunhosTable.id });

  return rascunho;
}
