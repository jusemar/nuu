import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { categoryTable, marcaTable, productPricingTable, productTable, productVariantTable } from "@/db/schema";
import { dbTransacional, encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { validarConfiguracaoRecompensaProduto } from "./recompensa-produto.schema";

const sufixo = randomUUID();
const categoriaId = randomUUID();
const marcaId = randomUUID();
const produtoId = randomUUID();

async function lerProdutoPersistido() {
  const [produto] = await dbTransacional.select().from(productTable)
    .where(eq(productTable.id, produtoId));
  const [preco] = await dbTransacional.select().from(productPricingTable)
    .where(eq(productPricingTable.productId, produtoId));
  const [variante] = await dbTransacional.select().from(productVariantTable)
    .where(eq(productVariantTable.productId, produtoId));
  assert.ok(produto && preco && variante);
  return { ...produto, precoNormalEmCentavos: preco.price, estoqueProdutoSimples: variante.stockQuantity };
}

async function executar() {
  try {
    await dbTransacional.insert(categoryTable).values({
      id: categoriaId, name: "Categoria configuração recompensa", slug: `categoria-recompensa-admin-${sufixo}`,
    });
    await dbTransacional.insert(marcaTable).values({
      id: marcaId, nome: "Marca configuração recompensa", slug: `marca-recompensa-admin-${sufixo}`,
    });
    await dbTransacional.insert(productTable).values({
      id: produtoId, categoryId: categoriaId, marcaId,
      name: "Produto normal configurável", slug: `produto-recompensa-admin-${sufixo}`,
      description: "Fixture isolada do cadastro administrativo.", sku: `SKU-${sufixo}`,
      productKind: "simple", status: "draft", recompensaPontosAtiva: false,
      recompensaCustoPontos: null,
    });
    await dbTransacional.insert(productPricingTable).values({
      productId: produtoId, type: "stock", price: 30_000,
      mainCardPrice: true, isActive: true,
    });
    await dbTransacional.insert(productVariantTable).values({
      productId: produtoId, sku: `SKU-${sufixo}`, name: "Variante técnica",
      attributes: {}, priceInCents: 30_000, stockQuantity: 7,
      isActive: true, isDefault: true,
    });

    const inicial = await lerProdutoPersistido();
    assert.equal(inicial.recompensaPontosAtiva, false);
    assert.equal(inicial.recompensaCustoPontos, null);
    assert.equal(inicial.estoqueProdutoSimples, 7);
    assert.equal(inicial.precoNormalEmCentavos, 30_000);

    const habilitar = validarConfiguracaoRecompensaProduto({
      recompensaPontosAtiva: true, recompensaCustoPontos: "2500",
    });
    assert.ok(habilitar.sucesso);
    await dbTransacional.update(productTable).set({
      recompensaPontosAtiva: habilitar.recompensaPontosAtiva,
      recompensaCustoPontos: habilitar.recompensaCustoPontos,
    }).where(eq(productTable.id, produtoId));
    const reaberto = await lerProdutoPersistido();
    assert.equal(reaberto.recompensaPontosAtiva, true);
    assert.equal(reaberto.recompensaCustoPontos, 2500);

    const editar = validarConfiguracaoRecompensaProduto({
      recompensaPontosAtiva: true, recompensaCustoPontos: "3000",
    }, reaberto);
    assert.ok(editar.sucesso);
    await dbTransacional.update(productTable).set({
      recompensaPontosAtiva: editar.recompensaPontosAtiva,
      recompensaCustoPontos: editar.recompensaCustoPontos,
    }).where(eq(productTable.id, produtoId));
    const atualizado = await lerProdutoPersistido();
    assert.equal(atualizado.recompensaCustoPontos, 3000);
    assert.equal(atualizado.estoqueProdutoSimples, 7);
    assert.equal(atualizado.precoNormalEmCentavos, 30_000);

    const desligar = validarConfiguracaoRecompensaProduto({ recompensaPontosAtiva: false }, atualizado);
    assert.ok(desligar.sucesso);
    await dbTransacional.update(productTable).set({
      recompensaPontosAtiva: desligar.recompensaPontosAtiva,
      recompensaCustoPontos: desligar.recompensaCustoPontos,
    }).where(eq(productTable.id, produtoId));
    const desabilitado = await lerProdutoPersistido();
    assert.equal(desabilitado.recompensaPontosAtiva, false);
    assert.equal(desabilitado.recompensaCustoPontos, 3000);
    assert.equal(desabilitado.estoqueProdutoSimples, 7);
    console.log("[recompensa:admin-produto] criação, edição, reabertura e desativação passaram");
  } finally {
    await dbTransacional.delete(productTable).where(eq(productTable.id, produtoId));
    await dbTransacional.delete(marcaTable).where(eq(marcaTable.id, marcaId));
    await dbTransacional.delete(categoryTable).where(eq(categoryTable.id, categoriaId));
    await encerrarBancoTransacionalIntegracao();
  }
}

export const execucao = executar();
