import { and, desc, eq, sql } from "drizzle-orm";

import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutoVinculosTable,
  productTable,
  produtoRascunhosTable,
} from "@/db/schema";
import {
  dbTransacional,
  encerrarBancoTransacionalIntegracao,
} from "@/db/transaction";
import {
  converterMetrosLaquilaParaCentimetros,
  converterQuilogramasLaquilaParaGramas,
} from "@/features/fornecedores/lib/publicacao/preparar-dimensoes-publicacao-fornecedor";

import {
  encerrarComFalhaDeDestino,
  exigirBancoLocal,
} from "./lib/guarda-banco-local";

/**
 * Repara somente produtos publicados e vinculados à integração Laquila ativa.
 * A fonte é sempre o rascunho Laquila mais recente do mesmo fornecedor/código.
 */
async function executar() {
  await exigirBancoLocal(["desenvolvimento"]);

  const linhas = await dbTransacional
    .select({
      produtoId: productTable.id,
      nome: productTable.name,
      pesoAtual: productTable.weight,
      alturaAtual: productTable.height,
      larguraAtual: productTable.width,
      comprimentoAtual: productTable.length,
      fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
      codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
      rascunhoId: produtoRascunhosTable.id,
      pesoOrigem: produtoRascunhosTable.peso,
      alturaOrigem: produtoRascunhosTable.altura,
      larguraOrigem: produtoRascunhosTable.largura,
      comprimentoOrigem: produtoRascunhosTable.comprimento,
      rascunhoAtualizadoEm: produtoRascunhosTable.atualizadoEm,
    })
    .from(fornecedorProdutoVinculosTable)
    .innerJoin(
      fornecedorIntegracoesApiTable,
      and(
        eq(
          fornecedorIntegracoesApiTable.fornecedorId,
          fornecedorProdutoVinculosTable.fornecedorId,
        ),
        eq(fornecedorIntegracoesApiTable.provedor, "laquila"),
        eq(fornecedorIntegracoesApiTable.ativo, true),
      ),
    )
    .innerJoin(
      productTable,
      eq(productTable.id, fornecedorProdutoVinculosTable.produtoId),
    )
    .innerJoin(
      produtoRascunhosTable,
      and(
        eq(
          produtoRascunhosTable.fornecedorId,
          fornecedorProdutoVinculosTable.fornecedorId,
        ),
        eq(
          produtoRascunhosTable.codigoFornecedor,
          fornecedorProdutoVinculosTable.codigoFornecedor,
        ),
        eq(produtoRascunhosTable.origemTipo, "fornecedor_api"),
        eq(produtoRascunhosTable.origemProvedor, "laquila"),
      ),
    )
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
        eq(productTable.isActive, true),
        eq(productTable.status, "published"),
      ),
    )
    .orderBy(desc(produtoRascunhosTable.atualizadoEm));

  const porProduto = new Map<string, (typeof linhas)[number]>();
  for (const linha of linhas) {
    if (!porProduto.has(linha.produtoId))
      porProduto.set(linha.produtoId, linha);
  }

  const reparos = [...porProduto.values()].map((linha) => {
    const pesoEsperado = converterQuilogramasLaquilaParaGramas(
      linha.pesoOrigem,
    );
    const altura = converterMetrosLaquilaParaCentimetros(linha.alturaOrigem);
    const largura = converterMetrosLaquilaParaCentimetros(linha.larguraOrigem);
    const comprimento = converterMetrosLaquilaParaCentimetros(
      linha.comprimentoOrigem,
    );

    if (
      !linha.codigoFornecedor ||
      !pesoEsperado ||
      !altura ||
      !largura ||
      !comprimento
    ) {
      throw new Error(
        `Produto ${linha.produtoId} possui medida original Laquila inválida; nada foi alterado.`,
      );
    }
    if (linha.pesoAtual !== pesoEsperado) {
      throw new Error(
        `Peso publicado diverge da origem no produto ${linha.produtoId}; nada foi alterado.`,
      );
    }

    return { ...linha, altura, largura, comprimento };
  });

  await dbTransacional.transaction(async (tx) => {
    for (const reparo of reparos) {
      const atualizados = await tx
        .update(productTable)
        .set({
          height: reparo.altura,
          width: reparo.largura,
          length: reparo.comprimento,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productTable.id, reparo.produtoId),
            sql`${productTable.weight} is not distinct from ${reparo.pesoAtual}`,
            sql`${productTable.height} is not distinct from ${reparo.alturaAtual}`,
            sql`${productTable.width} is not distinct from ${reparo.larguraAtual}`,
            sql`${productTable.length} is not distinct from ${reparo.comprimentoAtual}`,
          ),
        )
        .returning({ id: productTable.id });

      if (atualizados.length !== 1) {
        throw new Error(
          `Produto ${reparo.produtoId} mudou durante o reparo; transação cancelada.`,
        );
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        produtosCorrigidos: reparos.length,
        reparos: reparos.map((item) => ({
          produtoId: item.produtoId,
          nome: item.nome,
          codigoFornecedor: item.codigoFornecedor,
          rascunhoId: item.rascunhoId,
          antes: {
            peso: item.pesoAtual,
            altura: item.alturaAtual,
            largura: item.larguraAtual,
            comprimento: item.comprimentoAtual,
          },
          origem: {
            pesoKg: item.pesoOrigem,
            alturaMetros: item.alturaOrigem,
            larguraMetros: item.larguraOrigem,
            comprimentoMetros: item.comprimentoOrigem,
          },
          depois: {
            peso: item.pesoAtual,
            altura: item.altura,
            largura: item.largura,
            comprimento: item.comprimento,
          },
        })),
      },
      null,
      2,
    ),
  );
}

executar()
  .catch(encerrarComFalhaDeDestino)
  .finally(encerrarBancoTransacionalIntegracao);
