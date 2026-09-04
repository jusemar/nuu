import assert from "node:assert/strict";
import test from "node:test";

import { validarLogisticaProduto } from "./validar-logistica-produto";

const produtoValido = {
  pesoEmGramas: 100,
  alturaEmCm: 10,
  larguraEmCm: 10,
  comprimentoEmCm: 10,
  tiposEntregaPermitidos: ["own"],
};

test("aceita produto com logística geral completa", () => {
  assert.equal(validarLogisticaProduto(produtoValido).valido, true);
});

test("bloqueia dimensões ausentes ou inválidas", () => {
  assert.equal(
    validarLogisticaProduto({ ...produtoValido, alturaEmCm: null }).valido,
    false,
  );
  assert.equal(
    validarLogisticaProduto({ ...produtoValido, pesoEmGramas: 0 }).valido,
    false,
  );
});

test("preserva entrega própria como configuração válida fora da regra Laquila", () => {
  assert.equal(validarLogisticaProduto(produtoValido).problemas.length, 0);
});

test("aceita retirada local legítima sem exigir pacote para frete", () => {
  assert.equal(
    validarLogisticaProduto({
      pesoEmGramas: null,
      alturaEmCm: null,
      larguraEmCm: null,
      comprimentoEmCm: null,
      tiposEntregaPermitidos: [],
      permiteSomenteRetirada: true,
    }).valido,
    true,
  );
});

test("não usa retirada como atalho quando existe uma origem de envio", () => {
  const resultado = validarLogisticaProduto({
    ...produtoValido,
    alturaEmCm: null,
    permiteSomenteRetirada: true,
  });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.problemas[0]?.codigo, "ALTURA_AUSENTE");
});
