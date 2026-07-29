import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PrecoProdutoCalculado } from "@/features/precificacao/client";

import { formatarPromocaoPrecoPdp } from "./formatar-promocao-preco-pdp";

function criarPrecoCalculado(
  tipoDesconto: "percentual" | "valor_fixo",
): PrecoProdutoCalculado {
  return {
    produtoId: "produto-1",
    modalidade: "stock",
    moeda: "BRL",
    precoOriginalEmCentavos: 10_000,
    precoFinalEmCentavos: 8_000,
    promocao: {
      ativa: true,
      precoOriginalEmCentavos: 10_000,
      precoFinalEmCentavos: 8_000,
      descontoAplicadoEmCentavos: 2_000,
      regraAplicadaId: "promocao-1",
      tipoDesconto,
      valorDesconto: tipoDesconto === "percentual" ? 20 : 2_000,
    },
    pix: {
      ativo: true,
      valorEmCentavos: 6_960,
      valor: "R$ 69,60",
    },
    cartao: {
      ativo: true,
      valorEmCentavos: 8_000,
      valor: "R$ 80,00",
      parcelamentos: [],
    },
    boleto: { ativo: false },
    regrasAplicadas: ["promocao:promocao-1"],
  };
}

describe("formatarPromocaoPrecoPdp", () => {
  it("nao cria mensagem quando a precificacao nao aplicou promocao", () => {
    const preco = criarPrecoCalculado("percentual");
    preco.promocao.ativa = false;

    assert.equal(formatarPromocaoPrecoPdp(preco), null);
  });

  it("usa percentual efetivamente aplicado pela precificacao", () => {
    const promocao = formatarPromocaoPrecoPdp(
      criarPrecoCalculado("percentual"),
    );

    assert.equal(promocao?.rotuloDesconto, "20% OFF");
    assert.equal(promocao?.economiaFormatada, "R$ 20,00");
  });

  it("usa o valor real economizado para desconto de valor fixo", () => {
    const promocao = formatarPromocaoPrecoPdp(
      criarPrecoCalculado("valor_fixo"),
    );

    assert.equal(promocao?.rotuloDesconto, "R$ 20,00 OFF");
    assert.equal(promocao?.precoPromocionalFormatado, "R$ 80,00");
  });
});
