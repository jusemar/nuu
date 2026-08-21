import assert from "node:assert/strict";
import test from "node:test";

import type { PrecoProdutoCalculado } from "@/features/precificacao/client";
import { serializarJsonLd } from "@/lib/seo/serializar-json-ld";

import type {
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../types/product.types";
import {
  type IdentificadorCatalogoJsonLd,
  montarBreadcrumbListProduto,
  montarDadosEstruturadosProduto,
} from "./dados-estruturados-produto";

const URL_CANONICA = "https://loja.example.com/produto-canonico";

function criarPrecoCalculado(
  modalidade: string,
  precoFinalEmCentavos: number,
  opcoes: {
    precoPixEmCentavos?: number;
    precoCartaoEmCentavos?: number;
    pixAtivo?: boolean;
  } = {},
): PrecoProdutoCalculado {
  const precoPixEmCentavos = opcoes.precoPixEmCentavos ?? precoFinalEmCentavos;
  const precoCartaoEmCentavos =
    opcoes.precoCartaoEmCentavos ?? precoFinalEmCentavos;
  return {
    produtoId: "produto-1",
    modalidade,
    moeda: "BRL",
    precoOriginalEmCentavos: precoFinalEmCentavos,
    precoFinalEmCentavos,
    promocao: {
      ativa: false,
      precoOriginalEmCentavos: precoFinalEmCentavos,
      precoFinalEmCentavos,
      descontoAplicadoEmCentavos: 0,
      regraAplicadaId: null,
      tipoDesconto: null,
      valorDesconto: 0,
    },
    pix: {
      ativo: opcoes.pixAtivo ?? true,
      valorEmCentavos: precoPixEmCentavos,
      valor: "",
    },
    cartao: {
      ativo: true,
      valorEmCentavos: precoCartaoEmCentavos,
      valor: "",
      parcelamentos: [],
    },
    boleto: { ativo: false },
    regrasAplicadas: [],
  };
}

function criarModalidade(): PrecoModalidade {
  return {
    type: "stock",
    price: 12_990,
    mainCardPrice: true,
    pricingModalDescription: null,
    deliveryDays: null,
    hasPromo: false,
    promoType: null,
    promoPrice: null,
    promoEndDate: null,
    isActive: true,
  };
}

function criarVariante(
  id: string,
  precoEmCentavos: number,
  estoque = 5,
): VarianteProdutoLoja & {
  identificadoresCatalogo: IdentificadorCatalogoJsonLd[];
} {
  return {
    id,
    sku: id === "tecnica" ? "SKU-1" : `SKU-${id}`,
    name: null,
    attributes: id === "tecnica" ? {} : { Cor: id },
    priceInCents: precoEmCentavos,
    comparePriceInCents: null,
    stockQuantity: estoque,
    weightInGrams: null,
    heightInCm: null,
    widthInCm: null,
    lengthInCm: null,
    imageUrl: null,
    isActive: true,
    isDefault: id === "tecnica",
    identificadoresCatalogo: [],
  };
}

function criarIdentificador({
  tipo,
  valor,
  gtinTipo = null,
  status = "verificado",
}: {
  tipo: "gtin" | "mpn";
  valor: string;
  gtinTipo?: "gtin_8" | "gtin_12" | "gtin_13" | "gtin_14" | null;
  status?: "pendente" | "verificado" | "rejeitado" | "conflito";
}) {
  return {
    tipo,
    valor,
    gtinTipo,
    marcaId: "marca-1",
    status,
    principal: true,
  } as const;
}

function criarProduto(
  sobrescritas: Partial<
    Parameters<typeof montarDadosEstruturadosProduto>[0]["produto"]
  > = {},
) {
  return {
    name: "Produto seguro </script>",
    slug: "produto-seguro",
    description: "<p>Descrição real</p>",
    brand: "Marca Real",
    sku: "SKU-1",
    productKind: "simple",
    marcaId: "marca-1",
    identificadoresCatalogo: [],
    galleryImages: [
      {
        imageUrl: "https://cdn.example.com/produto.jpg",
        isPrimary: true,
      },
    ],
    pricing: [criarModalidade()],
    variants: [criarVariante("tecnica", 12_990)],
    ...sobrescritas,
  };
}

for (const [gtinTipo, campo, valor] of [
  ["gtin_8", "gtin8", "96385074"],
  ["gtin_12", "gtin12", "036000291452"],
  ["gtin_13", "gtin13", "4006381333931"],
  ["gtin_14", "gtin14", "10012345000017"],
] as const) {
  test(`produto simples publica ${campo} verificado`, () => {
    const variante = criarVariante("tecnica", 12_990);
    variante.identificadoresCatalogo = [
      criarIdentificador({ tipo: "gtin", valor, gtinTipo }),
    ];
    const dados = montarDadosEstruturadosProduto({
      produto: criarProduto({ variants: [variante] }),
      urlCanonica: URL_CANONICA,
      nomeVendedor: "Loja Real",
      precosCalculadosPorModalidade: {
        stock: criarPrecoCalculado("stock", 12_990),
      },
      precosCalculadosPorVariante: {},
    });
    assert.equal(dados[campo], valor);
  });
}

test("omite GTIN ausente, inválido, pendente ou com conflito", () => {
  for (const identificadoresCatalogo of [
    [],
    [
      criarIdentificador({
        tipo: "gtin",
        valor: "4006381333932",
        gtinTipo: "gtin_13",
      }),
    ],
    [
      criarIdentificador({
        tipo: "gtin",
        valor: "4006381333931",
        gtinTipo: "gtin_13",
        status: "pendente",
      }),
    ],
    [
      criarIdentificador({
        tipo: "gtin",
        valor: "4006381333931",
        gtinTipo: "gtin_13",
      }),
      criarIdentificador({
        tipo: "gtin",
        valor: "10012345000017",
        gtinTipo: "gtin_14",
        status: "conflito",
      }),
    ],
  ]) {
    const variante = criarVariante("tecnica", 12_990);
    variante.identificadoresCatalogo = identificadoresCatalogo;
    const dados = montarDadosEstruturadosProduto({
      produto: criarProduto({ variants: [variante] }),
      urlCanonica: URL_CANONICA,
      nomeVendedor: "Loja Real",
      precosCalculadosPorModalidade: {
        stock: criarPrecoCalculado("stock", 12_990),
      },
      precosCalculadosPorVariante: {},
    });
    assert.equal(dados.gtin8, undefined);
    assert.equal(dados.gtin12, undefined);
    assert.equal(dados.gtin13, undefined);
    assert.equal(dados.gtin14, undefined);
  }
});

test("produto variável não promove GTIN de variante e só publica MPN comum", () => {
  const azul = criarVariante("azul", 15_000);
  azul.identificadoresCatalogo = [
    criarIdentificador({
      tipo: "gtin",
      valor: "4006381333931",
      gtinTipo: "gtin_13",
    }),
    criarIdentificador({ tipo: "mpn", valor: "MPN-AZUL" }),
  ];
  const verde = criarVariante("verde", 11_000);
  verde.identificadoresCatalogo = [
    criarIdentificador({
      tipo: "gtin",
      valor: "10012345000017",
      gtinTipo: "gtin_14",
    }),
  ];
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto({
      productKind: "variable",
      variants: [azul, verde],
      identificadoresCatalogo: [
        criarIdentificador({ tipo: "mpn", valor: "MODELO-COMUM" }),
      ],
    }),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {},
    precosCalculadosPorVariante: {
      "variant:azul": criarPrecoCalculado("variant:azul", 15_000),
      "variant:verde": criarPrecoCalculado("variant:verde", 11_000),
    },
  });

  assert.equal(dados.gtin13, undefined);
  assert.equal(dados.gtin14, undefined);
  assert.equal(dados.mpn, "MODELO-COMUM");

  const semMpnComum = montarDadosEstruturadosProduto({
    produto: criarProduto({
      productKind: "variable",
      variants: [azul, verde],
      identificadoresCatalogo: [],
    }),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {},
    precosCalculadosPorVariante: {
      "variant:azul": criarPrecoCalculado("variant:azul", 15_000),
      "variant:verde": criarPrecoCalculado("variant:verde", 11_000),
    },
  });
  assert.equal(semMpnComum.mpn, undefined);
});

test("produto simples usa preço atual calculado, inclusive promocional", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto(),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {
      stock: criarPrecoCalculado("stock", 9_990, {
        precoPixEmCentavos: 8_990,
        precoCartaoEmCentavos: 9_990,
      }),
    },
    precosCalculadosPorVariante: {},
  });

  assert.equal(dados.offers?.["@type"], "Offer");
  assert.ok(dados.offers?.["@type"] === "Offer");
  assert.equal(dados.url, URL_CANONICA);
  assert.equal(dados.offers?.url, URL_CANONICA);
  assert.equal(dados.offers?.price, "89.90");
  assert.equal(dados.offers?.priceCurrency, "BRL");
  assert.equal(dados.offers?.availability, "https://schema.org/InStock");
  assert.deepEqual(dados.offers?.seller, {
    "@type": "Organization",
    name: "Loja Real",
  });
  assert.equal("itemCondition" in (dados.offers ?? {}), false);
});

test("produto variável agrega preços e ignora variante sem oferta válida", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto({
      productKind: "variable",
      variants: [
        criarVariante("azul", 15_000),
        criarVariante("verde", 11_000, 0),
        criarVariante("sem-preco", 8_000),
      ],
    }),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {},
    precosCalculadosPorVariante: {
      "variant:azul": criarPrecoCalculado("variant:azul", 15_000),
      "variant:verde": criarPrecoCalculado("variant:verde", 11_000),
    },
  });

  assert.equal(dados.offers?.["@type"], "AggregateOffer");
  assert.ok(dados.offers?.["@type"] === "AggregateOffer");
  assert.equal(dados.offers.lowPrice, "110.00");
  assert.equal(dados.offers.highPrice, "150.00");
  assert.equal(dados.offers.offerCount, 2);
  assert.equal(dados.offers.url, URL_CANONICA);
  assert.equal(dados.offers?.availability, "https://schema.org/InStock");
});

test("produto sem marca omite brand e preço sem promoção permanece integral", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto({ brand: null }),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {
      stock: criarPrecoCalculado("stock", 12_990),
    },
    precosCalculadosPorVariante: {},
  });

  assert.equal(dados.brand, undefined);
  assert.ok(dados.offers?.["@type"] === "Offer");
  assert.equal(dados.offers?.price, "129.90");
});

test("serialização mantém JSON válido e neutraliza encerramento da tag script", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto(),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {
      stock: criarPrecoCalculado("stock", 12_990),
    },
    precosCalculadosPorVariante: {},
  });
  const json = serializarJsonLd(dados);

  assert.equal(json.includes("</script>"), false);
  assert.deepEqual(JSON.parse(json), dados);
});

test("preço principal usa cartão quando Pix está inativo", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto(),
    urlCanonica: URL_CANONICA,
    nomeVendedor: null,
    precosCalculadosPorModalidade: {
      stock: criarPrecoCalculado("stock", 12_990, {
        precoPixEmCentavos: 11_990,
        precoCartaoEmCentavos: 13_490,
        pixAtivo: false,
      }),
    },
    precosCalculadosPorVariante: {},
  });

  assert.ok(dados.offers?.["@type"] === "Offer");
  assert.equal(dados.offers?.price, "134.90");
  assert.equal(dados.offers?.seller, undefined);
});

test("produto variável com uma única oferta válida mantém Offer", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto({
      productKind: "variable",
      variants: [criarVariante("unica", 10_000)],
    }),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {},
    precosCalculadosPorVariante: {
      "variant:unica": criarPrecoCalculado("variant:unica", 10_000),
    },
  });

  assert.equal(dados.offers?.["@type"], "Offer");
});

test("AggregateOffer totalmente indisponível usa OutOfStock", () => {
  const dados = montarDadosEstruturadosProduto({
    produto: criarProduto({
      productKind: "variable",
      variants: [
        criarVariante("azul", 15_000, 0),
        criarVariante("verde", 11_000, 0),
      ],
    }),
    urlCanonica: URL_CANONICA,
    nomeVendedor: "Loja Real",
    precosCalculadosPorModalidade: {},
    precosCalculadosPorVariante: {
      "variant:azul": criarPrecoCalculado("variant:azul", 15_000),
      "variant:verde": criarPrecoCalculado("variant:verde", 11_000),
    },
  });

  assert.ok(dados.offers?.["@type"] === "AggregateOffer");
  assert.equal(dados.offers.availability, "https://schema.org/OutOfStock");
});

test("BreadcrumbList replica Home, hierarquia de categorias e produto", () => {
  const dados = montarBreadcrumbListProduto({
    breadcrumbCategorias: [
      { id: "categoria-1", name: "Pai", slug: "pai" },
      { id: "categoria-2", name: "Filha", slug: "filha" },
    ],
    nomeProduto: "Produto",
    urlCanonica: URL_CANONICA,
  });

  assert.deepEqual(
    dados.itemListElement.map(({ position, name }) => ({ position, name })),
    [
      { position: 1, name: "Home" },
      { position: 2, name: "Pai" },
      { position: 3, name: "Filha" },
      { position: 4, name: "Produto" },
    ],
  );
  assert.equal(dados.itemListElement.at(-1)?.item, URL_CANONICA);
  dados.itemListElement.forEach((item) =>
    assert.match(item.item, /^https?:\/\//),
  );
});
