import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { resolverItemLogistico } from "../resolver-item-logistico";
import type {
  ProdutoParaItemLogistico,
  VarianteParaItemLogistico,
} from "../resolver-item-logistico";

const produtoSimplesCompleto: ProdutoParaItemLogistico = {
  identificador: "produto-simples",
  nome: "Produto Simples",
  codigoSku: "SKU-SIMPLES",
  tipo: "simples",
  pesoEmGramas: 1200,
  alturaEmCm: 15,
  larguraEmCm: 20,
  comprimentoEmCm: 30,
};

const produtoComVariantes: ProdutoParaItemLogistico = {
  identificador: "produto-variavel",
  nome: "Produto Variavel",
  codigoSku: "SKU-PAI",
  tipo: "com-variantes",
  pesoEmGramas: 9999,
  alturaEmCm: 99,
  larguraEmCm: 99,
  comprimentoEmCm: 99,
};

const varianteCompleta: VarianteParaItemLogistico = {
  identificador: "variante-220",
  nome: "Voltagem 220",
  codigoSku: "SKU-220",
  pesoEmGramas: 850,
  alturaEmCm: 10,
  larguraEmCm: 12,
  comprimentoEmCm: 18,
};

descrever("resolverItemLogistico", () => {
  verificar("resolve produto simples valido com medidas do produto", () => {
    const resultado = resolverItemLogistico({
      produto: produtoSimplesCompleto,
      quantidade: 2,
    });

    afirmacoes.equal(resultado.sucesso, true);

    if (!resultado.sucesso) return;

    afirmacoes.deepEqual(resultado.item.dimensoes, {
      alturaEmCm: 15,
      larguraEmCm: 20,
      comprimentoEmCm: 30,
    });
    afirmacoes.equal(resultado.item.pesoEmGramas, 1200);
    afirmacoes.equal(resultado.item.codigoSku, "SKU-SIMPLES");
    afirmacoes.equal(resultado.item.varianteId, null);
  });

  verificar("retorna erro para produto simples sem peso", () => {
    const resultado = resolverItemLogistico({
      produto: {
        ...produtoSimplesCompleto,
        pesoEmGramas: null,
      },
      quantidade: 1,
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erro.codigo, "dimensoes-incompletas");
    afirmacoes.deepEqual(resultado.erro.camposAusentes, ["pesoEmGramas"]);
  });

  verificar("retorna erro para produto simples sem dimensoes", () => {
    const resultado = resolverItemLogistico({
      produto: {
        ...produtoSimplesCompleto,
        alturaEmCm: null,
        larguraEmCm: null,
        comprimentoEmCm: null,
      },
      quantidade: 1,
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erro.codigo, "dimensoes-incompletas");
    afirmacoes.deepEqual(resultado.erro.camposAusentes, [
      "alturaEmCm",
      "larguraEmCm",
      "comprimentoEmCm",
    ]);
  });

  verificar("resolve variante valida com medidas da variante", () => {
    const resultado = resolverItemLogistico({
      produto: produtoComVariantes,
      variante: varianteCompleta,
      quantidade: 1,
    });

    afirmacoes.equal(resultado.sucesso, true);

    if (!resultado.sucesso) return;

    afirmacoes.equal(resultado.item.varianteId, "variante-220");
    afirmacoes.equal(resultado.item.pesoEmGramas, 850);
    afirmacoes.equal(resultado.item.codigoSku, "SKU-220");
    afirmacoes.deepEqual(resultado.item.dimensoes, {
      alturaEmCm: 10,
      larguraEmCm: 12,
      comprimentoEmCm: 18,
    });
  });

  verificar("retorna erro quando a variante e obrigatoria", () => {
    const resultado = resolverItemLogistico({
      produto: produtoComVariantes,
      quantidade: 1,
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erro.codigo, "variante-obrigatoria");
    afirmacoes.deepEqual(resultado.erro.camposAusentes, []);
  });

  verificar("retorna erro para variante sem dimensoes", () => {
    const resultado = resolverItemLogistico({
      produto: produtoComVariantes,
      variante: {
        ...varianteCompleta,
        larguraEmCm: null,
        comprimentoEmCm: null,
      },
      quantidade: 1,
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erro.codigo, "dimensoes-incompletas");
    afirmacoes.deepEqual(resultado.erro.camposAusentes, [
      "larguraEmCm",
      "comprimentoEmCm",
    ]);
  });

  verificar("retorna erro para quantidade invalida", () => {
    const resultado = resolverItemLogistico({
      produto: produtoSimplesCompleto,
      quantidade: 0,
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erro.codigo, "quantidade-invalida");
  });

  verificar("retorna erro para dados inconsistentes", () => {
    const resultado = resolverItemLogistico({
      produto: {
        ...produtoSimplesCompleto,
        nome: " ",
      },
      quantidade: 1,
      valorDeclaradoEmCentavos: -1,
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erro.codigo, "item-logistico-invalido");
  });
});
