import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { adaptarPrecosVitrine } from "@/features/precificacao/server";

import type { ProdutoFonteMerchant } from "../types/item-merchant";
import {
  montarItensMerchant,
  montarResultadoItensMerchant,
} from "./montar-itens-merchant";

type Precos = Awaited<ReturnType<typeof adaptarPrecosVitrine>>;

const identificadorGtin = {
  tipo: "gtin" as const,
  valor: "7891234567895",
  gtinTipo: "gtin_13" as const,
  status: "verificado" as const,
  principal: true,
  marcaId: null,
};

function produtoBase(): ProdutoFonteMerchant {
  return {
    id: "produto-1",
    name: "Produto",
    slug: "produto",
    description: "<p>Descrição segura</p>",
    sku: "SKU-SIMPLES",
    productKind: "simple",
    canonicalUrl: null,
    marcaId: "marca-1",
    marca: { nome: "Marca" },
    pricing: [
      {
        type: "stock",
        price: 1000,
        mainCardPrice: true,
        isActive: true,
      },
    ],
    galleryImages: [
      {
        imageUrl: "https://cdn.test/produto.jpg",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    identificadoresCatalogo: [],
    classificacoesLogisticas: [],
    variants: [
      {
        id: "variante-default",
        sku: "SKU-SIMPLES",
        name: null,
        attributes: {},
        priceInCents: 1000,
        comparePriceInCents: null,
        stockQuantity: 2,
        weightInGrams: null,
        heightInCm: null,
        widthInCm: null,
        lengthInCm: null,
        imageUrl: null,
        isActive: true,
        isDefault: true,
        identificadoresCatalogo: [identificadorGtin],
        classificacoesLogisticas: [],
      },
    ],
  };
}

function precoNormalizado(
  varianteId: string | null,
  valor: number,
  modalidade = varianteId ? `variant:${varianteId}` : "stock",
) {
  return {
    modalidade,
    varianteId,
    precoFinalEmCentavos: valor,
    precificacao: {
      pix: { ativo: true, valorEmCentavos: valor },
      cartao: { ativo: true, valorEmCentavos: valor },
    },
  } as unknown as Precos["produtosPorId"][string]["precos"][number];
}

function adaptarCom(precos: ReturnType<typeof precoNormalizado>[]) {
  return async () =>
    ({
      precosPorChave: {},
      produtosPorId: {
        "produto-1": {
          produtoId: "produto-1",
          produtoVariavel: precos.some((preco) => preco.varianteId),
          precoPrincipal: precos[0] ?? null,
          precos,
        },
      },
    }) as Precos;
}

describe("itens do Merchant Center", () => {
  it("gera produto simples com ID da variante técnica e GTIN confiável", async () => {
    const itens = await montarItensMerchant([produtoBase()], {
      adaptarPrecos: adaptarCom([precoNormalizado(null, 900)]),
    });
    assert.equal(itens.length, 1);
    assert.equal(itens[0]?.id, "SKU-SIMPLES");
    assert.equal(itens[0]?.price.amountInCents, 900);
    assert.equal(itens[0]?.availability, "in_stock");
    assert.equal(itens[0]?.gtin, "7891234567895");
    assert.equal(itens[0]?.itemGroupId, undefined);
  });

  it("gera uma oferta por variante, com IDs e grupo estáveis", async () => {
    const produto = produtoBase();
    produto.productKind = "variable";
    produto.variants = [
      {
        ...produto.variants[0]!,
        id: "v1",
        sku: "SKU-A",
        name: "Azul",
        attributes: { Cor: "Azul" },
        stockQuantity: 3,
      },
      {
        ...produto.variants[0]!,
        id: "v2",
        sku: "SKU-B",
        name: "Verde",
        attributes: { Cor: "Verde" },
        stockQuantity: 0,
        identificadoresCatalogo: [],
      },
      {
        ...produto.variants[0]!,
        id: "v3",
        sku: "SKU-C",
        name: "Inativa",
        isActive: false,
      },
    ];
    const itens = await montarItensMerchant([produto], {
      adaptarPrecos: adaptarCom([
        precoNormalizado("v1", 1000),
        precoNormalizado("v2", 1200),
      ]),
    });
    assert.deepEqual(
      itens.map((item) => item.id),
      ["SKU-A", "SKU-B"],
    );
    assert.deepEqual(
      itens.map((item) => item.itemGroupId),
      ["produto-1", "produto-1"],
    );
    assert.deepEqual(
      itens.map((item) => item.availability),
      ["in_stock", "out_of_stock"],
    );
    assert.deepEqual(
      itens.map((item) => item.link),
      [
        "http://localhost:3000/product/produto?variant=v1",
        "http://localhost:3000/product/produto?variant=v2",
      ],
    );
    assert.equal(itens[1]?.gtin, undefined);
    assert.deepEqual(itens[0]?.variantOptions, [
      { name: "Cor", value: "Azul" },
    ]);
  });

  it("exclui o grupo variável inteiro e retorna diagnóstico quando inválido", async () => {
    const produto = produtoBase();
    produto.productKind = "variable";
    produto.variants = [
      {
        ...produto.variants[0]!,
        id: "v1",
        sku: "SKU-A",
        attributes: { Cor: "Azul" },
      },
      {
        ...produto.variants[0]!,
        id: "v2",
        sku: "SKU-B",
        attributes: {},
      },
    ];

    const resultado = await montarResultadoItensMerchant([produto], {
      adaptarPrecos: adaptarCom([
        precoNormalizado("v1", 1000),
        precoNormalizado("v2", 1200),
      ]),
    });

    assert.deepEqual(resultado.itens, []);
    assert.deepEqual(resultado.diagnosticos, [
      {
        produtoId: "produto-1",
        produtoNome: "Produto",
        motivo: "atributo_diferenciador_ausente",
        detalhes: "A variante v2 não possui: cor.",
      },
    ]);
  });

  it("exclui item sem preço Merchant válido", async () => {
    const itens = await montarItensMerchant([produtoBase()], {
      adaptarPrecos: adaptarCom([]),
    });
    assert.deepEqual(itens, []);
  });

  it("omite label sem classificação e herda classificação do produto", async () => {
    const produto = produtoBase();
    let itens = await montarItensMerchant([produto], {
      adaptarPrecos: adaptarCom([precoNormalizado(null, 900)]),
    });
    assert.equal(itens[0]?.shippingLabel, undefined);

    produto.classificacoesLogisticas = [
      {
        tipoLogisticoId: "tipo-pesado",
        tipoLogistico: { ativo: true, identificador: "produto-pesado" },
      },
    ];
    itens = await montarItensMerchant([produto], {
      adaptarPrecos: adaptarCom([precoNormalizado(null, 900)]),
    });
    assert.equal(itens[0]?.shippingLabel, "produto-pesado");
  });

  it("override da variante substitui produto e mantém ordem estável", async () => {
    const produto = produtoBase();
    produto.productKind = "variable";
    produto.variants.push({
      ...produto.variants[0]!,
      id: "variante-secundaria",
      sku: "SKU-SECUNDARIA",
      attributes: { Cor: "Verde" },
      classificacoesLogisticas: [],
    });
    produto.variants[0]!.attributes = { Cor: "Azul" };
    produto.classificacoesLogisticas = [
      {
        tipoLogisticoId: "tipo-pesado",
        tipoLogistico: { ativo: true, identificador: "produto-pesado" },
      },
    ];
    produto.variants[0]!.classificacoesLogisticas = [
      {
        tipoLogisticoId: "tipo-fragil",
        tipoLogistico: { ativo: true, identificador: "produto-fragil" },
      },
      {
        tipoLogisticoId: "tipo-volume",
        tipoLogistico: { ativo: true, identificador: "grande-volume" },
      },
    ];
    const itens = await montarItensMerchant([produto], {
      adaptarPrecos: adaptarCom([
        precoNormalizado("variante-default", 900),
        precoNormalizado("variante-secundaria", 1000),
      ]),
    });
    const itemComOverride = itens.find((item) => item.id === "SKU-SIMPLES");
    assert.equal(
      itemComOverride?.shippingLabel,
      "grande-volume+produto-fragil",
    );
    assert.equal("shipping" in (itemComOverride ?? {}), false);
  });
});
