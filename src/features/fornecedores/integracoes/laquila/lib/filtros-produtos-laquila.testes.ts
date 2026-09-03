import assert from "node:assert/strict";
import { describe, it } from "node:test";

type ProdutoTeste = {
  nome: string;
  codigo: string;
  ncm: string;
  preco: number;
  estoque: number;
};

const produtos: ProdutoTeste[] = [
  {
    nome: "Capacete Beta",
    codigo: "200",
    ncm: "6506",
    preco: 332.64,
    estoque: 0,
  },
  {
    nome: "Boia Condor",
    codigo: "1104095",
    ncm: "9026",
    preco: 23.69,
    estoque: 100,
  },
  {
    nome: "Capacete Alfa",
    codigo: "1755259",
    ncm: "6506",
    preco: 2066.48,
    estoque: 4,
  },
];

function consultar({
  busca = "",
  estoque = "todos",
  minimo,
  maximo,
  ordem = "nome-asc",
  pagina = 1,
  limite = 25,
}: {
  busca?: string;
  estoque?: "todos" | "com" | "sem";
  minimo?: number;
  maximo?: number;
  ordem?:
    | "preco-asc"
    | "preco-desc"
    | "estoque-asc"
    | "estoque-desc"
    | "nome-asc"
    | "nome-desc";
  pagina?: number;
  limite?: number;
} = {}) {
  const termo = busca.toLocaleLowerCase("pt-BR");
  const filtrados = produtos.filter(
    (produto) =>
      (!termo ||
        `${produto.nome} ${produto.codigo} ${produto.ncm}`
          .toLocaleLowerCase("pt-BR")
          .includes(termo)) &&
      (estoque === "todos" ||
        (estoque === "com" ? produto.estoque > 0 : produto.estoque === 0)) &&
      (minimo === undefined || produto.preco >= minimo) &&
      (maximo === undefined || produto.preco <= maximo),
  );
  const sinal = ordem.endsWith("desc") ? -1 : 1;
  const campo = ordem.startsWith("preco")
    ? "preco"
    : ordem.startsWith("estoque")
      ? "estoque"
      : "nome";
  filtrados.sort(
    (a, b) =>
      sinal *
      (typeof a[campo] === "string"
        ? String(a[campo]).localeCompare(String(b[campo]), "pt-BR")
        : Number(a[campo]) - Number(b[campo])),
  );
  return filtrados.slice((pagina - 1) * limite, pagina * limite);
}

describe("contrato de filtros e ordenação do staging Laquila", () => {
  it("filtra com estoque, incluindo o saldo especial 100 sem alterá-lo", () => {
    assert.deepEqual(
      consultar({ estoque: "com" }).map((p) => p.estoque),
      [100, 4],
    );
  });
  it("filtra sem estoque", () =>
    assert.deepEqual(
      consultar({ estoque: "sem" }).map((p) => p.estoque),
      [0],
    ));
  it("ordena preço nos dois sentidos", () => {
    assert.deepEqual(
      consultar({ ordem: "preco-asc" }).map((p) => p.preco),
      [23.69, 332.64, 2066.48],
    );
    assert.deepEqual(
      consultar({ ordem: "preco-desc" }).map((p) => p.preco),
      [2066.48, 332.64, 23.69],
    );
  });
  it("ordena estoque nos dois sentidos", () => {
    assert.deepEqual(
      consultar({ ordem: "estoque-asc" }).map((p) => p.estoque),
      [0, 4, 100],
    );
    assert.deepEqual(
      consultar({ ordem: "estoque-desc" }).map((p) => p.estoque),
      [100, 4, 0],
    );
  });
  it("ordena nome nos dois sentidos", () => {
    assert.equal(consultar({ ordem: "nome-asc" })[0]?.nome, "Boia Condor");
    assert.equal(consultar({ ordem: "nome-desc" })[0]?.nome, "Capacete Beta");
  });
  it("aplica preço mínimo e máximo", () => {
    assert.deepEqual(
      consultar({ minimo: 300, maximo: 500 }).map((p) => p.preco),
      [332.64],
    );
  });
  it("combina estoque e preço com AND", () => {
    assert.deepEqual(
      consultar({ estoque: "com", maximo: 500 }).map((p) => p.codigo),
      ["1104095"],
    );
  });
  it("combina pesquisa, filtro e ordenação", () => {
    assert.deepEqual(
      consultar({ busca: "6506", estoque: "com", ordem: "preco-desc" }).map(
        (p) => p.codigo,
      ),
      ["1755259"],
    );
  });
  it("pagina somente depois de filtrar e ordenar", () => {
    assert.deepEqual(
      consultar({ ordem: "preco-asc", pagina: 2, limite: 1 }).map(
        (p) => p.preco,
      ),
      [332.64],
    );
  });
  it("consulta vazia mantém todos os itens", () =>
    assert.equal(consultar().length, 3));
});
