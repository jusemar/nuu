import type { PrecosProdutoPorModalidade } from "@/features/precificacao/client";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/domain";
import {
  validarGtin,
  validarMpnBasico,
} from "@/features/products/lib/identificadores-catalogo";
import { montarUrlAbsoluta } from "@/lib/seo/url-site";

import type { CategoriaBreadcrumb } from "../../category/queries/buscar-categoria-publica";
import type {
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../types/product.types";
import { stripProductRichText } from "../utils/rich-text";
import { resolverDisponibilidadeCompraPdp } from "./resolver-disponibilidade-compra-pdp";

type ProdutoParaDadosEstruturados = {
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  sku: string | null;
  productKind: string | null;
  marcaId: string | null;
  identificadoresCatalogo?: IdentificadorCatalogoJsonLd[];
  galleryImages: Array<{
    imageUrl: string;
    isPrimary: boolean | null;
  }>;
  pricing: PrecoModalidade[];
  variants: Array<
    VarianteProdutoLoja & {
      identificadoresCatalogo?: IdentificadorCatalogoJsonLd[];
    }
  >;
};

export type IdentificadorCatalogoJsonLd = {
  tipo: "gtin" | "mpn";
  valor: string;
  gtinTipo: "gtin_8" | "gtin_12" | "gtin_13" | "gtin_14" | null;
  marcaId: string | null;
  status: "pendente" | "verificado" | "rejeitado" | "conflito";
  principal: boolean;
};

type OfertaProduto = {
  "@type": "Offer";
  price: string;
  priceCurrency: "BRL";
  availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
  url: string;
  seller?: { "@type": "Organization"; name: string };
};

type OfertaAgregadaProduto = {
  "@type": "AggregateOffer";
  priceCurrency: "BRL";
  lowPrice: string;
  highPrice: string;
  offerCount: number;
  availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
  url: string;
  seller?: { "@type": "Organization"; name: string };
};

export type DadosEstruturadosProduto = {
  "@context": "https://schema.org";
  "@type": "Product";
  url: string;
  name: string;
  description?: string;
  image?: string;
  brand?: { "@type": "Brand"; name: string };
  sku?: string;
  gtin8?: string;
  gtin12?: string;
  gtin13?: string;
  gtin14?: string;
  mpn?: string;
  offers?: OfertaProduto | OfertaAgregadaProduto;
};

function selecionarIdentificadorConfiavel(
  identificadores: IdentificadorCatalogoJsonLd[],
  tipo: "gtin" | "mpn",
) {
  if (
    identificadores.some(
      (item) => item.tipo === tipo && item.status === "conflito",
    )
  ) {
    return null;
  }
  return (
    identificadores.find(
      (item) =>
        item.tipo === tipo && item.principal && item.status === "verificado",
    ) ?? null
  );
}

function montarIdentificadoresProduto(
  produto: ProdutoParaDadosEstruturados,
): Partial<
  Pick<
    DadosEstruturadosProduto,
    "gtin8" | "gtin12" | "gtin13" | "gtin14" | "mpn"
  >
> {
  if (produto.productKind === "variable") {
    const mpnProduto = selecionarIdentificadorConfiavel(
      produto.identificadoresCatalogo ?? [],
      "mpn",
    );
    const mpnValidado = mpnProduto
      ? validarMpnBasico({
          valor: mpnProduto.valor,
          declaradoExplicitamente: true,
        })
      : null;
    const marcaCompativel =
      !mpnProduto?.marcaId || mpnProduto.marcaId === produto.marcaId;
    return mpnValidado?.valido && marcaCompativel
      ? { mpn: mpnValidado.valor }
      : {};
  }

  const varianteTecnica = identificarVarianteTecnicaProdutoSimples({
    skuProduto: produto.sku ?? "",
    variantes: produto.variants.map((variante) => ({
      id: variante.id,
      sku: variante.sku,
      atributos: variante.attributes,
      precoEmCentavos: variante.priceInCents,
      estoque: variante.stockQuantity,
      ativa: variante.isActive,
      principal: variante.isDefault,
    })),
  });
  if (varianteTecnica.situacao !== "confiavel") return {};

  const variante = produto.variants.find(
    (item) => item.id === varianteTecnica.variante.id,
  );
  if (!variante) return {};

  const resultado: Partial<
    Pick<
      DadosEstruturadosProduto,
      "gtin8" | "gtin12" | "gtin13" | "gtin14" | "mpn"
    >
  > = {};
  const gtin = selecionarIdentificadorConfiavel(
    variante.identificadoresCatalogo ?? [],
    "gtin",
  );
  const gtinValidado = gtin ? validarGtin(gtin.valor) : null;
  if (gtinValidado?.valido && gtinValidado.tipo === gtin?.gtinTipo) {
    const campoPorTipo = {
      gtin_8: "gtin8",
      gtin_12: "gtin12",
      gtin_13: "gtin13",
      gtin_14: "gtin14",
    } as const;
    resultado[campoPorTipo[gtinValidado.tipo]] = gtinValidado.valor;
  }

  const mpnVariante = selecionarIdentificadorConfiavel(
    variante.identificadoresCatalogo ?? [],
    "mpn",
  );
  const mpnProduto = selecionarIdentificadorConfiavel(
    produto.identificadoresCatalogo ?? [],
    "mpn",
  );
  const mpn = mpnVariante ?? mpnProduto;
  const mpnValidado = mpn
    ? validarMpnBasico({ valor: mpn.valor, declaradoExplicitamente: true })
    : null;
  const marcaCompativel = !mpn?.marcaId || mpn.marcaId === produto.marcaId;
  if (mpnValidado?.valido && marcaCompativel) {
    resultado.mpn = mpnValidado.valor;
  }
  return resultado;
}

type ItemBreadcrumbProduto = {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
};

export type BreadcrumbListProduto = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ItemBreadcrumbProduto[];
};

function possuiPrecoCalculadoValido(
  preco: PrecosProdutoPorModalidade[string] | null | undefined,
) {
  return Boolean(
    preco &&
      Number.isSafeInteger(preco.precoFinalEmCentavos) &&
      preco.precoFinalEmCentavos > 0 &&
      ((preco.pix.ativo && preco.pix.valorEmCentavos > 0) ||
        (preco.cartao.ativo && preco.cartao.valorEmCentavos > 0)),
  );
}

/** Retorna o mesmo preço principal exibido pelo BuyBox: Pix, ou cartão. */
function obterPrecoPrincipalEmCentavos(
  preco: PrecosProdutoPorModalidade[string],
) {
  if (preco.pix.ativo && preco.pix.valorEmCentavos > 0) {
    return preco.pix.valorEmCentavos;
  }
  if (preco.cartao.ativo && preco.cartao.valorEmCentavos > 0) {
    return preco.cartao.valorEmCentavos;
  }
  return null;
}

function montarUrlImagem(url: string | null | undefined) {
  const valor = url?.trim();
  if (!valor) return undefined;

  try {
    const urlAbsoluta = new URL(valor);
    return ["http:", "https:"].includes(urlAbsoluta.protocol)
      ? urlAbsoluta.toString()
      : undefined;
  } catch {
    return montarUrlAbsoluta(valor);
  }
}

function selecionarModalidadeInicial(pricing: PrecoModalidade[]) {
  const ativas = pricing.filter((preco) => preco.isActive);
  const relampagoAtivo = ativas.find((preco) => {
    if (!preco.hasPromo || !preco.promoPrice || preco.promoType !== "flash") {
      return false;
    }
    const dataFinal = preco.promoEndDate ? new Date(preco.promoEndDate) : null;
    return Boolean(
      dataFinal &&
        !Number.isNaN(dataFinal.getTime()) &&
        dataFinal.getTime() > Date.now(),
    );
  });

  return (
    ativas.find((preco) => preco.mainCardPrice) ??
    relampagoAtivo ??
    ativas[0] ??
    null
  );
}

function montarVendedorOferta(nomeVendedor: string | null) {
  const vendedor = nomeVendedor?.trim();
  return vendedor
    ? { seller: { "@type": "Organization" as const, name: vendedor } }
    : {};
}

function montarOferta({
  precoEmCentavos,
  disponivel,
  url,
  nomeVendedor,
}: {
  precoEmCentavos: number;
  disponivel: boolean;
  url: string;
  nomeVendedor: string | null;
}): OfertaProduto {
  return {
    "@type": "Offer",
    price: (precoEmCentavos / 100).toFixed(2),
    priceCurrency: "BRL",
    availability: disponivel
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    url,
    ...montarVendedorOferta(nomeVendedor),
  };
}

function montarOfertaProdutoVariavel(
  variantes: VarianteProdutoLoja[],
  precos: PrecosProdutoPorModalidade,
  url: string,
  nomeVendedor: string | null,
): OfertaProduto | OfertaAgregadaProduto | undefined {
  const opcoes = variantes.flatMap((variante) => {
    if (!variante.isActive) return [];
    const preco = precos[`variant:${variante.id}`];
    if (!possuiPrecoCalculadoValido(preco) || !preco) return [];
    const precoPrincipalEmCentavos = obterPrecoPrincipalEmCentavos(preco);
    if (!precoPrincipalEmCentavos) return [];

    const disponibilidade = resolverDisponibilidadeCompraPdp({
      tipoProduto: "variable",
      modalidade: null,
      precoCalculado: preco,
      varianteSelecionada: variante,
      possuiVariantesPublicas: true,
    });

    return [
      {
        precoPrincipalEmCentavos,
        disponivel: disponibilidade.estado === "disponivel",
      },
    ];
  });
  const opcoesDisponiveis = opcoes.filter((opcao) => opcao.disponivel);
  if (opcoes.length === 0) return undefined;

  if (opcoes.length === 1) {
    const opcao = opcoes[0]!;
    return montarOferta({
      precoEmCentavos: opcao.precoPrincipalEmCentavos,
      disponivel: opcao.disponivel,
      url,
      nomeVendedor,
    });
  }

  const precosEmCentavos = opcoes.map(
    (opcao) => opcao.precoPrincipalEmCentavos,
  );
  return {
    "@type": "AggregateOffer",
    priceCurrency: "BRL",
    lowPrice: (Math.min(...precosEmCentavos) / 100).toFixed(2),
    highPrice: (Math.max(...precosEmCentavos) / 100).toFixed(2),
    offerCount: opcoes.length,
    availability:
      opcoesDisponiveis.length > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    url,
    ...montarVendedorOferta(nomeVendedor),
  };
}

function montarOfertaProdutoSimples(
  produto: ProdutoParaDadosEstruturados,
  precos: PrecosProdutoPorModalidade,
  url: string,
  nomeVendedor: string | null,
) {
  const modalidade = selecionarModalidadeInicial(produto.pricing);
  const preco = modalidade ? precos[modalidade.type] : null;
  if (!modalidade || !possuiPrecoCalculadoValido(preco) || !preco) {
    return undefined;
  }
  const precoPrincipalEmCentavos = obterPrecoPrincipalEmCentavos(preco);
  if (!precoPrincipalEmCentavos) return undefined;

  const varianteTecnica = identificarVarianteTecnicaProdutoSimples({
    skuProduto: produto.sku ?? "",
    variantes: produto.variants.map((variante) => ({
      id: variante.id,
      sku: variante.sku,
      atributos: variante.attributes,
      precoEmCentavos: variante.priceInCents,
      estoque: variante.stockQuantity,
      ativa: variante.isActive,
      principal: variante.isDefault,
    })),
  });
  const disponibilidade = resolverDisponibilidadeCompraPdp({
    tipoProduto: produto.productKind,
    modalidade,
    precoCalculado: preco,
    varianteSelecionada: null,
    possuiVariantesPublicas: produto.variants.some((item) => item.isActive),
    varianteTecnicaProdutoSimples: varianteTecnica,
  });

  return montarOferta({
    precoEmCentavos: precoPrincipalEmCentavos,
    disponivel: disponibilidade.estado === "disponivel",
    url,
    nomeVendedor,
  });
}

/** Monta o Product a partir dos mesmos dados e preços já carregados pela PDP. */
export function montarDadosEstruturadosProduto({
  produto,
  urlCanonica,
  nomeVendedor,
  precosCalculadosPorModalidade,
  precosCalculadosPorVariante,
}: {
  produto: ProdutoParaDadosEstruturados;
  urlCanonica: string;
  nomeVendedor: string | null;
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
  precosCalculadosPorVariante: PrecosProdutoPorModalidade;
}): DadosEstruturadosProduto {
  const url = urlCanonica;
  const descricao = stripProductRichText(produto.description ?? "");
  const marca = produto.brand?.trim();
  const sku = produto.sku?.trim();
  const imagemPrincipal =
    produto.galleryImages.find((imagem) => imagem.isPrimary)?.imageUrl ??
    produto.galleryImages[0]?.imageUrl;
  const imagem = montarUrlImagem(imagemPrincipal);
  const offers =
    produto.productKind === "variable"
      ? montarOfertaProdutoVariavel(
          produto.variants,
          precosCalculadosPorVariante,
          url,
          nomeVendedor,
        )
      : montarOfertaProdutoSimples(
          produto,
          precosCalculadosPorModalidade,
          url,
          nomeVendedor,
        );
  const identificadores = montarIdentificadoresProduto(produto);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    url,
    name: produto.name,
    ...(descricao ? { description: descricao } : {}),
    ...(imagem ? { image: imagem } : {}),
    ...(marca ? { brand: { "@type": "Brand", name: marca } } : {}),
    ...(sku ? { sku } : {}),
    ...identificadores,
    ...(offers ? { offers } : {}),
  };
}

/** Usa a mesma trilha do breadcrumb visual: Home, categorias e produto. */
export function montarBreadcrumbListProduto({
  breadcrumbCategorias,
  nomeProduto,
  urlCanonica,
}: {
  breadcrumbCategorias: CategoriaBreadcrumb[];
  nomeProduto: string;
  urlCanonica: string;
}): BreadcrumbListProduto {
  const itens = [
    { name: "Home", item: montarUrlAbsoluta("/") },
    ...breadcrumbCategorias.map((categoria) => ({
      name: categoria.name,
      item: montarUrlAbsoluta(`/category/${categoria.slug}`),
    })),
    { name: nomeProduto, item: urlCanonica },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      ...item,
    })),
  };
}
