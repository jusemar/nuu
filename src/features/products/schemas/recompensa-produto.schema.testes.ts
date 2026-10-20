import assert from "node:assert/strict";
import test from "node:test";

import { validarConfiguracaoRecompensaProduto } from "./recompensa-produto.schema";

test("produto novo nasce como compra normal sem recompensa", () => {
  const resultado = validarConfiguracaoRecompensaProduto({});
  assert.deepEqual(resultado, {
    sucesso: true,
    recompensaPontosAtiva: false,
    recompensaCustoPontos: null,
  });
});

test("recompensa habilitada exige custo inteiro positivo", () => {
  const valido = validarConfiguracaoRecompensaProduto({
    recompensaPontosAtiva: true,
    recompensaCustoPontos: "2500",
  });
  assert.equal(valido.sucesso, true);
  if (valido.sucesso) assert.equal(valido.recompensaCustoPontos, 2500);
  for (const custo of ["", "0", "-1", "2.5", 0, -1, 2.5, null]) {
    const invalido = validarConfiguracaoRecompensaProduto({
      recompensaPontosAtiva: true,
      recompensaCustoPontos: custo,
    });
    assert.equal(invalido.sucesso, false, `custo ${String(custo)} foi aceito`);
  }
});

test("desabilitar remove a elegibilidade e preserva o custo configurado", () => {
  const anterior = { recompensaPontosAtiva: true, recompensaCustoPontos: 2500 };
  assert.deepEqual(validarConfiguracaoRecompensaProduto({
    recompensaPontosAtiva: false,
    recompensaCustoPontos: "",
  }, anterior), {
    sucesso: true,
    recompensaPontosAtiva: false,
    recompensaCustoPontos: 2500,
  });
});

test("editar custo habilitado valida o novo valor e mantém outros dados fora do escopo", () => {
  const anterior = { recompensaPontosAtiva: true, recompensaCustoPontos: 2500 };
  const resultado = validarConfiguracaoRecompensaProduto({
    recompensaPontosAtiva: true,
    recompensaCustoPontos: "3000",
  }, anterior);
  assert.equal(resultado.sucesso, true);
  if (resultado.sucesso) assert.equal(resultado.recompensaCustoPontos, 3000);
  assert.deepEqual(validarConfiguracaoRecompensaProduto({}, anterior), {
    sucesso: true,
    recompensaPontosAtiva: true,
    recompensaCustoPontos: 2500,
  });
});

test("servidor rejeita toggle manipulado ou custo acima do limite inteiro do PostgreSQL", () => {
  assert.equal(validarConfiguracaoRecompensaProduto({ recompensaPontosAtiva: "true" }).sucesso, false);
  assert.equal(validarConfiguracaoRecompensaProduto({
    recompensaPontosAtiva: true,
    recompensaCustoPontos: "2147483648",
  }).sucesso, false);
});
