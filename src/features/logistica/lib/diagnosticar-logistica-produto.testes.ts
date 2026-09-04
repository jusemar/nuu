import assert from "node:assert/strict";
import test from "node:test";

import { diagnosticarLogisticaProduto } from "./diagnosticar-logistica-produto";

const produtoBase = {
  id: "produto-1",
  pesoEmGramas: 500,
  alturaEmCm: 10,
  larguraEmCm: 20,
  comprimentoEmCm: 30,
  tiposEntregaPermitidos: ["own"],
  permiteRetirada: false,
};

test("preserva estoque próprio com entrega própria legítima", () => {
  const resultado = diagnosticarLogisticaProduto({ produto: produtoBase });

  assert.equal(resultado.valido, true);
  assert.equal(resultado.origem.chave, "estoque-proprio");
});

test("aceita produto exclusivamente para retirada sem dimensões de frete", () => {
  const resultado = diagnosticarLogisticaProduto({
    produto: {
      ...produtoBase,
      pesoEmGramas: null,
      alturaEmCm: null,
      larguraEmCm: null,
      comprimentoEmCm: null,
      tiposEntregaPermitidos: [],
      permiteRetirada: true,
    },
  });

  assert.equal(resultado.valido, true);
  assert.equal(resultado.origem.chave, "retirada-local");
});

test("aplica a especialização Laquila sem proibir own globalmente", () => {
  const resultado = diagnosticarLogisticaProduto({
    produto: produtoBase,
    vinculos: [
      {
        fornecedorId: "fornecedor-1",
        fornecedorNome: "Laquila",
        vinculoStatus: "ativo",
        codigoFornecedor: "63993",
        provedor: "laquila",
      },
    ],
  });

  assert.equal(resultado.valido, false);
  assert.deepEqual(
    resultado.problemas.map((problema) => problema.codigo),
    ["CONFIGURACAO_LOGISTICA_INVALIDA"],
  );
});

test("aceita Laquila com vínculo, código e origem do fornecedor", () => {
  const resultado = diagnosticarLogisticaProduto({
    produto: { ...produtoBase, tiposEntregaPermitidos: ["supplier"] },
    vinculos: [
      {
        fornecedorId: "fornecedor-1",
        fornecedorNome: "Laquila",
        vinculoStatus: "ativo",
        codigoFornecedor: "63993",
        provedor: "laquila",
      },
    ],
  });

  assert.equal(resultado.valido, true);
  assert.equal(resultado.origem.chave, "laquila");
});
