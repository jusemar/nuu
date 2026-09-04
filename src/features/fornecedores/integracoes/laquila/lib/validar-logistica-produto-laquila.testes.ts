import assert from "node:assert/strict";
import test from "node:test";

import { validarLogisticaProdutoLaquila } from "./validar-logistica-produto-laquila";

const base = {
  pesoEmGramas: 10,
  alturaEmCm: 2,
  larguraEmCm: 2,
  comprimentoEmCm: 2,
  possuiVinculoFornecedor: true,
  codigoFornecedor: "123",
  tiposEntregaPermitidos: ["supplier"],
};

test("aceita logística Laquila completa", () =>
  assert.equal(validarLogisticaProdutoLaquila(base).valido, true));
test("rejeita altura ausente, zero, código e entrega própria", () => {
  assert.deepEqual(
    validarLogisticaProdutoLaquila({
      ...base,
      alturaEmCm: null,
      codigoFornecedor: "",
      tiposEntregaPermitidos: ["own"],
    }).problemas.map((p) => p.codigo),
    [
      "ALTURA_AUSENTE",
      "CODIGO_FORNECEDOR_AUSENTE",
      "CONFIGURACAO_LOGISTICA_INVALIDA",
    ],
  );
  assert.equal(
    validarLogisticaProdutoLaquila({ ...base, alturaEmCm: 0 }).valido,
    false,
  );
});
