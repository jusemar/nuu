import assert from "node:assert/strict";
import test from "node:test";

import {
  type PoliticaEntregaPropriaResolucao,
  type PrecoPoliticaEntregaPropriaResolucao,
  resolverPoliticaEntregaPropria,
  resolverPoliticaRetiradaEntregaPropria,
} from "./resolver-politica-entrega-propria";

const produto = "produto";
const categoria = "categoria";
const base: PoliticaEntregaPropriaResolucao[] = [
  {
    id: "cat",
    escopo: "categoria",
    produtoId: null,
    categoriaId: categoria,
    incluirDescendentes: false,
    ativa: true,
    entregaRapidaAtiva: true,
    entregaProgramadaAtiva: false,
    diasAtendidos: [1, 3, 5],
    horarioCorte: "13:00",
    prazoMinimoProgramadaDias: null,
  },
];

function preco(
  politicaId: string,
  tipoDestino: PrecoPoliticaEntregaPropriaResolucao["tipoDestino"],
  destinoIdOuUf: string,
  valor: number,
): PrecoPoliticaEntregaPropriaResolucao {
  return {
    politicaId,
    tipoDestino,
    destinoIdOuUf,
    precoRapidaEmCentavos: valor,
    precoProgramadaEmCentavos: null,
    ativa: true,
  };
}

test("produto específico prevalece sobre categoria e preserva frete grátis", () => {
  const resultado = resolverPoliticaEntregaPropria({
    politicas: [
      ...base,
      {
        ...base[0],
        id: "prod",
        escopo: "produto",
        produtoId: produto,
        categoriaId: null,
        incluirDescendentes: false,
        ativa: true,
      },
    ],
    precos: [
      preco("cat", "cidade", "bh", 3000),
      preco("prod", "cidade", "bh", 0),
    ],
    contexto: {
      produtoId: produto,
      categoriaId: categoria,
      ancestraisCategoriaIds: [],
      destinos: { cidade: "bh", uf: "MG" },
    },
  });
  assert.equal(resultado?.preco.precoRapidaEmCentavos, 0);
});

test("aplica CEP > bairro > região > cidade > UF", () => {
  const precos = [
    preco("cat", "uf", "MG", 5000),
    preco("cat", "cidade", "bh", 3000),
    preco("cat", "regiao", "barreiro", 700),
    preco("cat", "bairro", "x", 500),
    preco("cat", "cep", "cep-x", 200),
  ];
  const resultado = resolverPoliticaEntregaPropria({
    politicas: base,
    precos,
    contexto: {
      produtoId: produto,
      categoriaId: categoria,
      ancestraisCategoriaIds: [],
      destinos: {
        cep: "cep-x",
        bairro: "x",
        regiao: "barreiro",
        cidade: "bh",
        uf: "MG",
      },
    },
  });
  assert.equal(resultado?.preco.tipoDestino, "cep");
  assert.equal(resultado?.preco.precoRapidaEmCentavos, 200);
});

test("categoria filha só herda quando descendentes estiver ativo", () => {
  const contexto = {
    produtoId: produto,
    categoriaId: "filha",
    ancestraisCategoriaIds: [categoria],
    destinos: { uf: "MG" },
  };
  assert.equal(
    resolverPoliticaEntregaPropria({
      politicas: base,
      precos: [preco("cat", "uf", "MG", 5000)],
      contexto,
    }),
    null,
  );
  const resultado = resolverPoliticaEntregaPropria({
    politicas: [{ ...base[0], incluirDescendentes: true }],
    precos: [preco("cat", "uf", "MG", 5000)],
    contexto,
  });
  assert.equal(resultado?.preco.precoRapidaEmCentavos, 5000);
});

test("preços rápida e programada são independentes", () => {
  const resultado = resolverPoliticaEntregaPropria({
    politicas: base,
    precos: [
      {
        ...preco("cat", "cidade", "bh", 700),
        precoProgramadaEmCentavos: 0,
      },
    ],
    contexto: {
      produtoId: produto,
      categoriaId: categoria,
      ancestraisCategoriaIds: [],
      destinos: { cidade: "bh" },
    },
  });
  assert.equal(resultado?.preco.precoRapidaEmCentavos, 700);
  assert.equal(resultado?.preco.precoProgramadaEmCentavos, 0);
});

test("retirada por categoria respeita descendentes e precedência do produto", () => {
  const politicaCategoria = {
    ...base[0],
    incluirDescendentes: true,
    permiteRetirada: true,
  };
  const politicaProduto = {
    ...base[0],
    id: "prod",
    escopo: "produto" as const,
    produtoId: produto,
    categoriaId: null,
    permiteRetirada: false,
  };
  const resultado = resolverPoliticaRetiradaEntregaPropria({
    politicas: [politicaCategoria, politicaProduto],
    contexto: {
      produtoId: produto,
      categoriaId: "filha",
      ancestraisCategoriaIds: [categoria],
    },
  });
  assert.equal(resultado?.id, "prod");
  assert.equal(resultado?.permiteRetirada, false);
});
