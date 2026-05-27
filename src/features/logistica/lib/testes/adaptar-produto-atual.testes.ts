import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import {
  adaptarProdutoAtualParaLogistica,
  adaptarVarianteAtualParaLogistica,
} from "../adaptadores/adaptar-produto-atual";

descrever("adaptadores de produto atual", () => {
  verificar("adapta produto simples atual para o contrato logistico", () => {
    const produto = adaptarProdutoAtualParaLogistica({
      identificadorProduto: "produto-1",
      nomeProduto: "Produto atual",
      codigoSkuProduto: "SKU-ATUAL",
      tipoProdutoAtual: "simple",
      pesoProdutoEmGramas: 700,
      alturaProdutoEmCm: 8,
      larguraProdutoEmCm: 12,
      comprimentoProdutoEmCm: 24,
    });

    afirmacoes.deepEqual(produto, {
      identificador: "produto-1",
      nome: "Produto atual",
      codigoSku: "SKU-ATUAL",
      tipo: "simples",
      pesoEmGramas: 700,
      alturaEmCm: 8,
      larguraEmCm: 12,
      comprimentoEmCm: 24,
    });
  });

  verificar("adapta produto atual com variantes", () => {
    const produto = adaptarProdutoAtualParaLogistica({
      identificadorProduto: "produto-2",
      nomeProduto: "Produto variavel",
      tipoProdutoAtual: "variable",
    });

    afirmacoes.equal(produto.tipo, "com-variantes");
    afirmacoes.equal(produto.pesoEmGramas, null);
  });

  verificar("adapta variante atual para o contrato logistico", () => {
    const variante = adaptarVarianteAtualParaLogistica({
      identificadorVariante: "variante-1",
      nomeVariante: "Cor Verde",
      codigoSkuVariante: "SKU-VERDE",
      pesoVarianteEmGramas: 600,
      alturaVarianteEmCm: 6,
      larguraVarianteEmCm: 10,
      comprimentoVarianteEmCm: 18,
    });

    afirmacoes.deepEqual(variante, {
      identificador: "variante-1",
      nome: "Cor Verde",
      codigoSku: "SKU-VERDE",
      pesoEmGramas: 600,
      alturaEmCm: 6,
      larguraEmCm: 10,
      comprimentoEmCm: 18,
    });
  });
});
