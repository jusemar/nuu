import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  converterValorDescontoEntreTipos,
  converterValorMonetarioParaCentavos,
  formatarCentavosComoValorMonetario,
  formatarValorMonetarioParaEdicao,
  sanitizarEntradaValorMonetario,
} from "./valores-monetarios-promocao";

describe("valores monetarios de promocao", () => {
  it("converte reais digitados para centavos", () => {
    assert.equal(converterValorMonetarioParaCentavos("50"), 5_000);
    assert.equal(converterValorMonetarioParaCentavos("50,90"), 5_090);
    assert.equal(converterValorMonetarioParaCentavos("1.299,99"), 129_999);
  });

  it("formata valores persistidos em reais para edicao", () => {
    assert.equal(formatarCentavosComoValorMonetario(5_000), "50,00");
    assert.equal(formatarCentavosComoValorMonetario(129_999), "1.299,99");
  });

  it("sanitiza e normaliza a entrada exibida no formulario", () => {
    assert.equal(sanitizarEntradaValorMonetario("R$ 1.299,99"), "1.299,99");
    assert.equal(formatarValorMonetarioParaEdicao("20"), "20,00");
    assert.equal(formatarValorMonetarioParaEdicao("20,50"), "20,50");
    assert.equal(formatarValorMonetarioParaEdicao("1.299,99"), "1.299,99");
  });

  it("mantem a equivalencia ao alternar o tipo de desconto", () => {
    assert.equal(
      converterValorDescontoEntreTipos(2_000, "percentual", "valor_fixo"),
      "20,00",
    );
    assert.equal(
      converterValorDescontoEntreTipos("20,00", "valor_fixo", "percentual"),
      20,
    );
  });

  it("rejeita valores vazios, negativos ou invalidos", () => {
    assert.equal(converterValorMonetarioParaCentavos(""), null);
    assert.equal(converterValorMonetarioParaCentavos("-50"), null);
    assert.equal(converterValorMonetarioParaCentavos("50.90"), null);
  });
});
