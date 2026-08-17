import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  converterMetrosLaquilaParaCentimetros,
  converterQuilogramasLaquilaParaGramas,
  prepararDimensoesPublicacaoFornecedor,
} from "./preparar-dimensoes-publicacao-fornecedor";

describe("dimensões da publicação Laquila", () => {
  it("converte metros para centímetros com arredondamento determinístico", () => {
    assert.equal(converterMetrosLaquilaParaCentimetros("0.010"), 1);
    assert.equal(converterMetrosLaquilaParaCentimetros("0.590"), 59);
    assert.equal(converterMetrosLaquilaParaCentimetros("0.960"), 96);
    assert.equal(converterMetrosLaquilaParaCentimetros("0.280"), 28);
    assert.equal(converterMetrosLaquilaParaCentimetros("0.580"), 58);
    assert.equal(converterMetrosLaquilaParaCentimetros("0.680"), 68);
  });

  it("preserva a conversão de quilogramas para gramas", () => {
    assert.equal(converterQuilogramasLaquilaParaGramas("0.650"), 650);
    assert.equal(converterQuilogramasLaquilaParaGramas("1.159"), 1159);
  });

  it("não transforma zero, nulo ou valor inválido em medida artificial", () => {
    assert.equal(converterMetrosLaquilaParaCentimetros("0"), null);
    assert.equal(converterMetrosLaquilaParaCentimetros(null), null);
    assert.equal(converterMetrosLaquilaParaCentimetros("inválido"), null);
  });

  it("não multiplica dimensões de produto não-Laquila", () => {
    assert.deepEqual(
      prepararDimensoesPublicacaoFornecedor({
        origemTipo: "fornecedor_excel",
        origemProvedor: "planilha",
        dimensoes: {
          peso: "0.650",
          altura: "10",
          largura: "59",
          comprimento: "96",
        },
      }),
      {
        pesoEmKg: "0.650",
        alturaEmCm: "10",
        larguraEmCm: "59",
        comprimentoEmCm: "96",
      },
    );
  });
});
