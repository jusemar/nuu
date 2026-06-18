import { and, eq, isNull, ne } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorProdutoVinculosTable,
  fornecedoresTable,
  productTable,
} from "@/db/schema";

import { salvarVinculoProdutoFornecedorManualSchema } from "../schemas/fornecedores.schema";
import type { ResultadoSalvarVinculoProdutoFornecedorManual } from "../types/fornecedores.types";

function normalizarCodigoFornecedor(codigo: string | null | undefined) {
  const codigoNormalizado = codigo?.trim();
  return codigoNormalizado ? codigoNormalizado : null;
}

function condicaoMesmoCodigoFornecedor(
  fornecedorId: string,
  codigoFornecedor: string,
  vinculoIdIgnorado?: string,
) {
  const condicoes = [
    eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedorId),
    eq(fornecedorProdutoVinculosTable.codigoFornecedor, codigoFornecedor),
    eq(fornecedorProdutoVinculosTable.status, "ativo" as const),
  ];

  if (vinculoIdIgnorado) {
    condicoes.push(ne(fornecedorProdutoVinculosTable.id, vinculoIdIgnorado));
  }

  return and(...condicoes);
}

function condicaoMesmoVinculoProdutoFornecedor(
  fornecedorId: string,
  produtoId: string,
  codigoFornecedor: string | null,
  vinculoIdIgnorado?: string,
) {
  const condicoes = [
    eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedorId),
    eq(fornecedorProdutoVinculosTable.produtoId, produtoId),
    codigoFornecedor
      ? eq(fornecedorProdutoVinculosTable.codigoFornecedor, codigoFornecedor)
      : isNull(fornecedorProdutoVinculosTable.codigoFornecedor),
    eq(fornecedorProdutoVinculosTable.status, "ativo" as const),
  ];

  if (vinculoIdIgnorado) {
    condicoes.push(ne(fornecedorProdutoVinculosTable.id, vinculoIdIgnorado));
  }

  return and(...condicoes);
}

async function validarDuplicidadeVinculoAtivo(entrada: {
  fornecedorId: string;
  produtoId: string;
  codigoFornecedor: string | null;
  vinculoIdIgnorado?: string;
}) {
  if (entrada.codigoFornecedor) {
    const [vinculoMesmoCodigo] = await db
      .select({ id: fornecedorProdutoVinculosTable.id })
      .from(fornecedorProdutoVinculosTable)
      .where(
        condicaoMesmoCodigoFornecedor(
          entrada.fornecedorId,
          entrada.codigoFornecedor,
          entrada.vinculoIdIgnorado,
        ),
      )
      .limit(1);

    if (vinculoMesmoCodigo) {
      throw new Error(
        "Já existe vínculo ativo para este código neste fornecedor.",
      );
    }
  }

  const [vinculoMesmoProdutoECodigo] = await db
    .select({ id: fornecedorProdutoVinculosTable.id })
    .from(fornecedorProdutoVinculosTable)
    .where(
      condicaoMesmoVinculoProdutoFornecedor(
        entrada.fornecedorId,
        entrada.produtoId,
        entrada.codigoFornecedor,
        entrada.vinculoIdIgnorado,
      ),
    )
    .limit(1);

  if (vinculoMesmoProdutoECodigo) {
    throw new Error("Já existe vínculo ativo igual para este fornecedor.");
  }
}

export async function salvarVinculoProdutoFornecedorManual(
  entrada: unknown,
): Promise<ResultadoSalvarVinculoProdutoFornecedorManual> {
  const dados = salvarVinculoProdutoFornecedorManualSchema.parse(entrada);
  const codigoFornecedor = normalizarCodigoFornecedor(dados.codigoFornecedor);

  const [fornecedor] = await db
    .select({ id: fornecedoresTable.id })
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, dados.fornecedorId))
    .limit(1);

  if (!fornecedor) {
    throw new Error("Fornecedor não encontrado.");
  }

  const [produto] = await db
    .select({ id: productTable.id })
    .from(productTable)
    .where(eq(productTable.id, dados.produtoId))
    .limit(1);

  if (!produto) {
    throw new Error("Produto não encontrado.");
  }

  if (dados.status === "ativo") {
    await validarDuplicidadeVinculoAtivo({
      fornecedorId: fornecedor.id,
      produtoId: produto.id,
      codigoFornecedor,
      vinculoIdIgnorado: dados.id,
    });
  }

  if (dados.id) {
    const [vinculoAtualizado] = await db
      .update(fornecedorProdutoVinculosTable)
      .set({
        codigoFornecedor,
        produtoId: produto.id,
        status: dados.status,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(fornecedorProdutoVinculosTable.id, dados.id),
          eq(fornecedorProdutoVinculosTable.fornecedorId, fornecedor.id),
        ),
      )
      .returning({ id: fornecedorProdutoVinculosTable.id });

    if (!vinculoAtualizado) {
      throw new Error("Vínculo não encontrado.");
    }

    return {
      vinculoId: vinculoAtualizado.id,
      fornecedorId: fornecedor.id,
      produtoId: produto.id,
      codigoFornecedor,
      status: dados.status,
    };
  }

  const [vinculoCriado] = await db
    .insert(fornecedorProdutoVinculosTable)
    .values({
      fornecedorId: fornecedor.id,
      produtoId: produto.id,
      codigoFornecedor,
      tipoVinculo: "manual",
      status: dados.status,
    })
    .returning({ id: fornecedorProdutoVinculosTable.id });

  return {
    vinculoId: vinculoCriado.id,
    fornecedorId: fornecedor.id,
    produtoId: produto.id,
    codigoFornecedor,
    status: dados.status,
  };
}
