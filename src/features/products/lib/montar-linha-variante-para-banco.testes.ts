import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { productVariantSchema } from "../schemas/product-variants.schema";
import {
  COLUNAS_PERSISTIDAS_DA_VARIANTE,
  montarLinhaVarianteParaBanco,
} from "./montar-linha-variante-para-banco";

const AGORA = new Date("2026-08-05T12:00:00.000Z");
const PRODUTO_ID = "11111111-1111-4111-8111-111111111111";

function validar(ajustes: Record<string, unknown> = {}) {
  const resultado = productVariantSchema.safeParse({
    sku: "SKU-1",
    attributes: { cor: "preto" },
    priceInCents: 10_000,
    stockQuantity: 5,
    ...ajustes,
  });

  if (!resultado.success) {
    throw new Error(
      `variante invalida no teste: ${resultado.error.issues[0]?.message}`,
    );
  }

  return resultado.data;
}

describe("montagem da linha de variante para o banco", () => {
  /**
   * Este é o teste que existe por causa de um risco real: salvar variantes apaga todas e
   * reinsere. Um campo que exista no schema mas não no mapeamento é aceito na validação e
   * descartado em silêncio na gravação. Aqui a divergência vira falha imediata.
   */
  it("persiste todos os campos que o schema aceita, sem descartar nenhum", () => {
    const linha = montarLinhaVarianteParaBanco(validar(), PRODUTO_ID, AGORA);

    for (const coluna of COLUNAS_PERSISTIDAS_DA_VARIANTE) {
      assert.ok(
        coluna in linha,
        `A coluna "${coluna}" sumiu do mapeamento — ela seria descartada em silêncio ao salvar.`,
      );
    }

    // Campos do schema que NÃO são coluna da variante. Qualquer chave nova precisa ser
    // classificada de propósito: ou entra em COLUNAS_PERSISTIDAS_DA_VARIANTE, ou entra aqui.
    const naoSaoColunaDaVariante = new Set([
      "id",
      "productId",
      "classificacoesLogisticasIds",
      // Persistidos na tabela canônica de identificadores, nunca na variante.
      "gtin",
      "mpn",
    ]);

    const camposDoSchema = Object.keys(productVariantSchema.shape);
    const naoClassificados = camposDoSchema.filter(
      (campo) =>
        !naoSaoColunaDaVariante.has(campo) &&
        !COLUNAS_PERSISTIDAS_DA_VARIANTE.includes(
          campo as (typeof COLUNAS_PERSISTIDAS_DA_VARIANTE)[number],
        ),
    );

    assert.deepEqual(
      naoClassificados,
      [],
      `Campos novos no schema sem destino definido: ${naoClassificados.join(", ")}`,
    );
  });

  it("preserva os tres estados do pagamento na entrega", () => {
    const herdando = montarLinhaVarianteParaBanco(
      validar({ aceitaPagamentoNaEntrega: null }),
      PRODUTO_ID,
      AGORA,
    );
    const aceitando = montarLinhaVarianteParaBanco(
      validar({ aceitaPagamentoNaEntrega: true }),
      PRODUTO_ID,
      AGORA,
    );
    const bloqueando = montarLinhaVarianteParaBanco(
      validar({ aceitaPagamentoNaEntrega: false }),
      PRODUTO_ID,
      AGORA,
    );

    assert.equal(herdando.aceitaPagamentoNaEntrega, null);
    assert.equal(aceitando.aceitaPagamentoNaEntrega, true);
    // O caso mais frágil: `false` não pode virar `null`, senão a variante bloqueada
    // voltaria a herdar "aceita" do produto.
    assert.equal(bloqueando.aceitaPagamentoNaEntrega, false);
  });

  it("campo ausente vira null (herda), nunca false", () => {
    const linha = montarLinhaVarianteParaBanco(validar(), PRODUTO_ID, AGORA);

    assert.equal(linha.aceitaPagamentoNaEntrega, null);
  });

  it("mantem os demais campos intactos", () => {
    const linha = montarLinhaVarianteParaBanco(
      validar({
        sku: "SKU-2",
        name: "Preto P",
        weightInGrams: 500,
        isDefault: true,
      }),
      PRODUTO_ID,
      AGORA,
    );

    assert.equal(linha.productId, PRODUTO_ID);
    assert.equal(linha.sku, "SKU-2");
    assert.equal(linha.name, "Preto P");
    assert.equal(linha.weightInGrams, 500);
    assert.equal(linha.isDefault, true);
    assert.equal(linha.isActive, true);
    assert.equal(linha.updatedAt, AGORA);
  });
});
