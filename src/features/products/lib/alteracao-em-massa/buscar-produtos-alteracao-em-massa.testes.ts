import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { produtoCorrespondeBuscaAlteracaoEmMassa } from "./buscar-produtos-alteracao-em-massa";

const produtos = [
  {
    id: "western",
    nome: "HD SATA3 2TB WESTERN DIGITAL Blue",
    sku: "WD-HD20-AZUL",
    categoriaId: "armazenamento",
    ativo: true,
  },
  {
    id: "seagate",
    nome: "HD  SATA3 SEAGATE BARRACUDA 2TB",
    sku: "SEA-ST2000-DM",
    categoriaId: "armazenamento",
    ativo: true,
  },
  {
    id: "memoria",
    nome: "Memória DDR4 16GB",
    sku: "MEM-16-ÁGIL",
    categoriaId: "memorias",
    ativo: false,
  },
];

const buscar = (termo: string) =>
  produtos.filter((produto) =>
    produtoCorrespondeBuscaAlteracaoEmMassa(produto, termo),
  );

describe("busca da alteração em massa", () => {
  it('encontra todos os produtos compatíveis com "HD SATA3"', () => {
    assert.deepEqual(
      buscar("HD SATA3").map((produto) => produto.id),
      ["western", "seagate"],
    );
  });

  it('encontra os dois produtos de 2TB com "HD SATA3 2"', () => {
    assert.deepEqual(
      buscar("HD SATA3 2").map((produto) => produto.id),
      ["western", "seagate"],
    );
  });

  it("aceita os termos em outra ordem", () => {
    assert.equal(buscar("2 SATA3 HD").length, 2);
  });

  it("aceita busca parcial por SKU", () => {
    assert.deepEqual(
      buscar("st200").map((produto) => produto.id),
      ["seagate"],
    );
  });

  it("ignora espaços duplicados", () => {
    assert.equal(buscar("  HD    SATA3   2  ").length, 2);
  });

  it("ignora caixa e acentos", () => {
    assert.deepEqual(
      buscar("mem agil").map((produto) => produto.id),
      ["memoria"],
    );
  });

  it("retorna vazio quando todos os termos não existem", () => {
    assert.equal(buscar("HD SATA3 NVME").length, 0);
  });

  it("permanece combinável com categoria e demais filtros", () => {
    const resultado = produtos.filter(
      (produto) =>
        produto.categoriaId === "armazenamento" &&
        produto.ativo &&
        produtoCorrespondeBuscaAlteracaoEmMassa(produto, "2 HD"),
    );
    assert.deepEqual(
      resultado.map((produto) => produto.id),
      ["western", "seagate"],
    );
  });
});
