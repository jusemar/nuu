import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ItemCarrinho, NovoItemCarrinho } from "../types/carrinho.types";
import { adicionarItensAoCarrinho } from "./adicionar-itens-carrinho";

function criarItem(
  produtoId: string,
  quantidade = 1,
  frete: NovoItemCarrinho["freteEscolhido"] = {
    id: "retirada",
    nome: "Cliente Retira",
    prazo: "Disponível amanhã",
    valorEmCentavos: 0,
    cep: "30140071",
  },
): NovoItemCarrinho {
  return {
    produtoId,
    produtoVarianteId: `${produtoId}-variante`,
    nome: produtoId,
    modalidadeTipo: "stock",
    variante: "stock",
    imagemUrl: "/produto.webp",
    precoEmCentavos: 1000,
    freteEscolhido: frete,
    quantidade,
  };
}

describe("inclusão atômica de itens no carrinho", () => {
  it("inclui somente o lote confirmado com principal e adicionais", () => {
    const resultado = adicionarItensAoCarrinho(
      [],
      [criarItem("adicional-a"), criarItem("principal", 3)],
    );

    assert.deepEqual(
      resultado.map(({ produtoId, quantidade }) => ({ produtoId, quantidade })),
      [
        { produtoId: "adicional-a", quantidade: 1 },
        { produtoId: "principal", quantidade: 3 },
      ],
    );
    assert.equal(
      resultado.every((item) => item.freteEscolhido),
      true,
    );
  });

  it("preserva a consolidação atual quando o item já existe", () => {
    const existente = adicionarItensAoCarrinho([], [criarItem("principal", 2)]);
    const resultado = adicionarItensAoCarrinho(existente, [
      criarItem("principal", 3),
    ]);

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0]?.quantidade, 5);
  });

  it("não modifica o carrinho quando não há confirmação de itens", () => {
    const existente = adicionarItensAoCarrinho([], [criarItem("principal")]);
    const referencia = existente as ItemCarrinho[];
    const resultado = adicionarItensAoCarrinho(referencia, []);

    assert.deepEqual(resultado, existente);
  });
});
