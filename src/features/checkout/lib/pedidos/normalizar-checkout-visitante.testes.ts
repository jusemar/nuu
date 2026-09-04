import assert from "node:assert/strict";
import test from "node:test";

import type { ItemCarrinho } from "@/features/carrinho";

import { resolverItemVendavelCheckout } from "./normalizar-checkout-visitante";

const itemBase: ItemCarrinho = {
  id: "item-1",
  produtoId: "00000000-0000-4000-8000-000000000001",
  produtoVarianteId: "00000000-0000-4000-8000-000000000002",
  nome: "Produto teste",
  modalidadeTipo: "stock",
  imagemUrl: "/produto.webp",
  precoEmCentavos: 10_000,
  quantidade: 1,
};

const precoBase = {
  type: "stock",
  pricingModalDescription: "Estoque próprio",
  price: 10_000,
  mainCardPrice: true,
  deliveryDays: "1 dia",
  hasPromo: false,
  promoType: null,
  promoPrice: null,
  promoEndDate: null,
  promoDuration: null,
  promoDurationUnit: null,
  isActive: true,
};

const varianteTecnica = {
  id: "00000000-0000-4000-8000-000000000002",
  sku: "SIMPLES-1",
  name: "Produto teste",
  attributes: {},
  priceInCents: 10_000,
  stockQuantity: 2,
  imageUrl: null,
  weightInGrams: null,
  heightInCm: null,
  widthInCm: null,
  lengthInCm: null,
  isActive: true,
  isDefault: true,
};

function produtoSimples() {
  return {
    id: itemBase.produtoId,
    name: itemBase.nome,
    sku: varianteTecnica.sku,
    productKind: "simple",
    isActive: true,
    status: "published",
    weight: 1_000,
    height: 10,
    width: 20,
    length: 30,
    allowedDeliveryTypes: ["own"],
    allowsPickup: false,
    pricing: [precoBase],
    variants: [varianteTecnica],
  };
}

test("bloqueia produto sem dimensão logística obrigatória", () => {
  const produto = produtoSimples();

  assert.throws(
    () =>
      resolverItemVendavelCheckout({
        item: itemBase,
        produto: { ...produto, height: null },
      }),
    /temporariamente indisponível/,
  );
});

test("resolve produto simples de estoque próprio pela variante técnica", () => {
  const resultado = resolverItemVendavelCheckout({
    item: itemBase,
    produto: produtoSimples(),
  });

  assert.equal(resultado.tipo, "simple");
  assert.equal(resultado.varianteTecnica.id, varianteTecnica.id);
});

test("bloqueia produto simples de estoque próprio sem saldo", () => {
  assert.throws(
    () =>
      resolverItemVendavelCheckout({
        item: { ...itemBase, quantidade: 3 },
        produto: produtoSimples(),
      }),
    /Estoque insuficiente para Produto teste/,
  );
});

for (const modalidade of ["pre_sale", "dropshipping", "order_basis"]) {
  test(`${modalidade} não exige estoque local`, () => {
    const produto = produtoSimples();
    produto.pricing = [{ ...precoBase, type: modalidade }];
    produto.variants = [{ ...varianteTecnica, stockQuantity: 0 }];

    const resultado = resolverItemVendavelCheckout({
      item: { ...itemBase, modalidadeTipo: modalidade },
      produto,
    });

    assert.equal(resultado.tipo, "simple");
  });
}

test("bloqueia variante técnica simples divergente da informada no carrinho", () => {
  assert.throws(
    () =>
      resolverItemVendavelCheckout({
        item: {
          ...itemBase,
          produtoVarianteId: "00000000-0000-4000-8000-000000000099",
        },
        produto: produtoSimples(),
      }),
    /Variante técnica inválida/,
  );
});

test("mantém compatibilidade segura com item simples antigo sem id de variante", () => {
  const resultado = resolverItemVendavelCheckout({
    item: { ...itemBase, produtoVarianteId: undefined },
    produto: produtoSimples(),
  });

  assert.equal(resultado.tipo, "simple");
  assert.equal(resultado.varianteTecnica.id, varianteTecnica.id);
});

test("bloqueia produto simples com variante técnica ambígua", () => {
  const produto = produtoSimples();
  produto.variants = [
    varianteTecnica,
    {
      ...varianteTecnica,
      id: "00000000-0000-4000-8000-000000000003",
    },
  ];

  assert.throws(
    () => resolverItemVendavelCheckout({ item: itemBase, produto }),
    /possui 2 registros internos/,
  );
});

test("usa somente a variante realmente selecionada no produto variável", () => {
  const produto = {
    ...produtoSimples(),
    productKind: "variable",
    variants: [
      { ...varianteTecnica, id: itemBase.produtoVarianteId! },
      {
        ...varianteTecnica,
        id: "00000000-0000-4000-8000-000000000003",
        stockQuantity: 0,
      },
    ],
  };

  const resultado = resolverItemVendavelCheckout({ item: itemBase, produto });

  assert.equal(resultado.tipo, "variant");
  assert.equal(resultado.variante.id, itemBase.produtoVarianteId);
});

test("bloqueia variante selecionada cujo estoque mudou", () => {
  const produto = {
    ...produtoSimples(),
    productKind: "variable",
    variants: [{ ...varianteTecnica, stockQuantity: 0 }],
  };

  assert.throws(
    () => resolverItemVendavelCheckout({ item: itemBase, produto }),
    /Estoque insuficiente/,
  );
});

test("bloqueia modalidade que ficou inativa depois da inclusão", () => {
  const produto = produtoSimples();
  produto.pricing = [{ ...precoBase, isActive: false }];

  assert.throws(
    () => resolverItemVendavelCheckout({ item: itemBase, produto }),
    /Modalidade inativa/,
  );
});

test("aceita Sob encomenda canônica quando o banco usa a chave histórica", () => {
  const produto = produtoSimples();
  produto.pricing = [{ ...precoBase, type: "orderBasis" }];
  produto.variants = [{ ...varianteTecnica, stockQuantity: 0 }];

  const resultado = resolverItemVendavelCheckout({
    item: { ...itemBase, modalidadeTipo: "order_basis" },
    produto,
  });

  assert.equal(resultado.tipo, "simple");
  assert.equal(resultado.precoSelecionado.type, "orderBasis");
});

test("mantém item antigo cuja chave de Sob encomenda usa camelCase", () => {
  const produto = produtoSimples();
  produto.pricing = [{ ...precoBase, type: "order_basis" }];

  const resultado = resolverItemVendavelCheckout({
    item: { ...itemBase, modalidadeTipo: "orderBasis" },
    produto,
  });

  assert.equal(resultado.tipo, "simple");
});

test("bloqueia com motivo específico modalidade conhecida ausente", () => {
  assert.throws(
    () =>
      resolverItemVendavelCheckout({
        item: { ...itemBase, modalidadeTipo: "order_basis" },
        produto: produtoSimples(),
      }),
    /Modalidade não encontrada/,
  );
});

test("produto variável em Sob encomenda não exige estoque local", () => {
  const produto = {
    ...produtoSimples(),
    productKind: "variable",
    pricing: [{ ...precoBase, type: "orderBasis" }],
    variants: [{ ...varianteTecnica, stockQuantity: 0 }],
  };

  const resultado = resolverItemVendavelCheckout({
    item: { ...itemBase, modalidadeTipo: "order_basis" },
    produto,
  });

  assert.equal(resultado.tipo, "variant");
  assert.equal(resultado.precoSelecionado?.type, "orderBasis");
});

test("produto variável em Estoque próprio continua exigindo estoque", () => {
  const produto = {
    ...produtoSimples(),
    productKind: "variable",
    variants: [{ ...varianteTecnica, stockQuantity: 0 }],
  };

  assert.throws(
    () => resolverItemVendavelCheckout({ item: itemBase, produto }),
    /Estoque insuficiente/,
  );
});

test("bloqueia preço que deixou de ser válido", () => {
  const produto = produtoSimples();
  produto.pricing = [{ ...precoBase, price: 0 }];

  assert.throws(
    () => resolverItemVendavelCheckout({ item: itemBase, produto }),
    /Produto sem preço válido/,
  );
});
