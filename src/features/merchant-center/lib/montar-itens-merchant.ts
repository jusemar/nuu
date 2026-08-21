import type { adaptarPrecosVitrine } from "@/features/precificacao/server";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/domain";
import {
  validarGtin,
  validarMpnBasico,
} from "@/features/products/lib/identificadores-catalogo";
import { resolverUrlCanonicaProduto } from "@/features/products/lib/url-canonica-produto";
import { montarUrlProdutoComVariante } from "@/features/products/lib/url-variante-produto";
import { resolverDisponibilidadeCompraPdp } from "@/features/store/products/lib/resolver-disponibilidade-compra-pdp";
import { stripProductRichText } from "@/features/store/products/utils/rich-text";
import { montarUrlAbsoluta } from "@/lib/seo/url-site";

import type {
  DisponibilidadeMerchant,
  IdentificadorFonteMerchant,
  ItemMerchant,
  ProdutoFonteMerchant,
  VarianteFonteMerchant,
} from "../types/item-merchant";
import { derivarShippingLabel } from "./derivar-shipping-label";
import {
  type MotivoGrupoVariantesMerchantInvalido,
  validarGrupoVariantesMerchant,
} from "./mapear-atributos-variantes-merchant";
import { resolverPoliticaIdentificacaoMerchant } from "./resolver-politica-identificacao-merchant";

function urlAbsoluta(valor: string) {
  return /^https?:\/\//i.test(valor) ? valor : montarUrlAbsoluta(valor);
}

function selecionarImagem(
  produto: ProdutoFonteMerchant,
  variante?: VarianteFonteMerchant,
) {
  if (variante?.imageUrl?.trim()) return urlAbsoluta(variante.imageUrl.trim());
  const imagem = [...produto.galleryImages]
    .sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )[0]
    ?.imageUrl?.trim();
  return imagem ? urlAbsoluta(imagem) : null;
}

function selecionarConfiavel(
  identificadores: IdentificadorFonteMerchant[],
  tipo: "gtin" | "mpn",
  marcaId: string,
) {
  if (
    identificadores.some(
      (item) => item.tipo === tipo && item.status === "conflito",
    )
  ) {
    return undefined;
  }
  const item = identificadores.find(
    (candidato) =>
      candidato.tipo === tipo &&
      candidato.principal &&
      candidato.status === "verificado",
  );
  if (!item) return undefined;
  if (tipo === "gtin") {
    const resultado = validarGtin(item.valor);
    return resultado.valido && resultado.tipo === item.gtinTipo
      ? resultado.valor
      : undefined;
  }
  if (item.marcaId && item.marcaId !== marcaId) return undefined;
  const resultado = validarMpnBasico({
    valor: item.valor,
    declaradoExplicitamente: true,
  });
  return resultado.valido ? resultado.valor : undefined;
}

function tituloVariante(
  produto: ProdutoFonteMerchant,
  variante: VarianteFonteMerchant,
) {
  const complemento =
    variante.name?.trim() || Object.values(variante.attributes).join(" / ");
  return complemento ? `${produto.name} - ${complemento}` : produto.name;
}

function mapearDisponibilidadeVariavel(
  variante: VarianteFonteMerchant,
  preco: NonNullable<
    Awaited<
      ReturnType<typeof adaptarPrecosVitrine>
    >["produtosPorId"][string]["precoPrincipal"]
  >,
): DisponibilidadeMerchant {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "variable",
    modalidade: null,
    precoCalculado: preco.precificacao,
    varianteSelecionada: variante,
    possuiVariantesPublicas: true,
  });
  return resultado.estado === "disponivel" ? "in_stock" : "out_of_stock";
}

function mapearDisponibilidadeSimples(
  modalidade: ProdutoFonteMerchant["pricing"][number],
  preco: NonNullable<
    Awaited<
      ReturnType<typeof adaptarPrecosVitrine>
    >["produtosPorId"][string]["precoPrincipal"]
  >,
  varianteTecnica: ReturnType<typeof identificarVarianteTecnicaProdutoSimples>,
): DisponibilidadeMerchant {
  const resultado = resolverDisponibilidadeCompraPdp({
    tipoProduto: "simple",
    modalidade: {
      type: modalidade.type as
        | "stock"
        | "pre_sale"
        | "dropshipping"
        | "order_basis",
      price: modalidade.price,
      mainCardPrice: modalidade.mainCardPrice ?? undefined,
      pricingModalDescription: modalidade.pricingModalDescription ?? null,
      deliveryDays: modalidade.deliveryDays ?? null,
      hasPromo: modalidade.hasPromo ?? false,
      promoType:
        modalidade.promoType === "normal" || modalidade.promoType === "flash"
          ? modalidade.promoType
          : null,
      promoPrice: modalidade.promoPrice ?? null,
      promoEndDate: modalidade.promoEndDate
        ? new Date(modalidade.promoEndDate)
        : null,
      isActive: modalidade.isActive ?? true,
    },
    precoCalculado: preco.precificacao,
    varianteSelecionada: null,
    possuiVariantesPublicas: false,
    varianteTecnicaProdutoSimples: varianteTecnica,
  });
  if (resultado.estado !== "disponivel") return "out_of_stock";
  if (modalidade.type === "pre_sale") return "preorder";
  if (modalidade.type === "order_basis") return "backorder";
  return "in_stock";
}

export type DiagnosticoGrupoVariantesMerchant = {
  produtoId: string;
  produtoNome: string;
  motivo: MotivoGrupoVariantesMerchantInvalido;
  detalhes: string;
};

export async function montarResultadoItensMerchant(
  produtos: ProdutoFonteMerchant[],
  dependencias: {
    adaptarPrecos?: typeof adaptarPrecosVitrine;
  } = {},
): Promise<{
  itens: ItemMerchant[];
  diagnosticos: DiagnosticoGrupoVariantesMerchant[];
}> {
  const adaptarPrecos =
    dependencias.adaptarPrecos ??
    (await import("@/features/precificacao/server")).adaptarPrecosVitrine;
  const precos = await adaptarPrecos(produtos);
  const itens: ItemMerchant[] = [];
  const diagnosticos: DiagnosticoGrupoVariantesMerchant[] = [];

  for (const produto of produtos) {
    const descricao = stripProductRichText(produto.description);
    const link = resolverUrlCanonicaProduto({
      slug: produto.slug,
      urlCanonicaSalva: produto.canonicalUrl,
    });
    const brand = produto.marca?.nome.trim() || undefined;
    const precosProduto = precos.produtosPorId[produto.id];
    if (!descricao || !precosProduto) continue;

    if (produto.productKind === "variable") {
      const variantes = produto.variants
        .filter((variante) => variante.isActive)
        .sort((a, b) => a.sku.localeCompare(b.sku));
      const variantesPublicaveis = variantes.filter((variante) => {
        const preco = precosProduto.precos.find(
          (item) => item.varianteId === variante.id,
        );
        const imageLink = selecionarImagem(produto, variante);
        return Boolean(
          preco &&
            preco.precoFinalEmCentavos > 0 &&
            imageLink &&
            variante.sku.trim(),
        );
      });
      const grupo = validarGrupoVariantesMerchant(variantesPublicaveis);
      if (!grupo.valido) {
        diagnosticos.push({
          produtoId: produto.id,
          produtoNome: produto.name,
          motivo: grupo.motivo,
          detalhes: grupo.detalhes,
        });
        continue;
      }
      const atributosPorVariante = grupo.atributosPorVariante;
      for (const variante of variantesPublicaveis) {
        const preco = precosProduto.precos.find(
          (item) => item.varianteId === variante.id,
        )!;
        const imageLink = selecionarImagem(produto, variante)!;
        const gtin = selecionarConfiavel(
          variante.identificadoresCatalogo,
          "gtin",
          produto.marcaId,
        );
        const mpn = selecionarConfiavel(
          variante.identificadoresCatalogo,
          "mpn",
          produto.marcaId,
        );
        const shippingLabel = derivarShippingLabel({
          vinculosProduto: produto.classificacoesLogisticas,
          vinculosVariante: variante.classificacoesLogisticas,
        });
        const atributosMerchant = atributosPorVariante.get(variante.id);
        itens.push({
          id: variante.sku.trim(),
          title: tituloVariante(produto, variante),
          description: descricao,
          link: montarUrlProdutoComVariante({
            urlProduto: link,
            varianteId: variante.id,
          }),
          imageLink,
          availability: mapearDisponibilidadeVariavel(variante, preco),
          price: { amountInCents: preco.precoFinalEmCentavos, currency: "BRL" },
          ...(brand ? { brand } : {}),
          ...(gtin ? { gtin } : {}),
          ...(mpn ? { mpn } : {}),
          ...(shippingLabel ? { shippingLabel } : {}),
          itemGroupId: produto.id,
          itemGroupTitle: produto.name,
          ...(atributosMerchant ?? {}),
          ...resolverPoliticaIdentificacaoMerchant(),
        });
      }
      continue;
    }

    const varianteTecnica = identificarVarianteTecnicaProdutoSimples({
      skuProduto: produto.sku,
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
    const preco = precosProduto.precoPrincipal;
    const modalidade = produto.pricing.find(
      (item) => item.type === preco?.modalidade,
    );
    const imageLink = selecionarImagem(produto);
    if (
      varianteTecnica.situacao !== "confiavel" ||
      !preco ||
      !modalidade ||
      preco.precoFinalEmCentavos <= 0 ||
      !imageLink
    )
      continue;
    const identificadores =
      varianteTecnica.situacao === "confiavel"
        ? (produto.variants.find(
            (item) => item.id === varianteTecnica.variante.id,
          )?.identificadoresCatalogo ?? [])
        : [];
    const gtin = selecionarConfiavel(identificadores, "gtin", produto.marcaId);
    const mpnVariante = selecionarConfiavel(
      identificadores,
      "mpn",
      produto.marcaId,
    );
    const mpnProduto = selecionarConfiavel(
      produto.identificadoresCatalogo,
      "mpn",
      produto.marcaId,
    );
    const varianteFonte = produto.variants.find(
      (item) => item.id === varianteTecnica.variante.id,
    );
    const shippingLabel = derivarShippingLabel({
      vinculosProduto: produto.classificacoesLogisticas,
      vinculosVariante: varianteFonte?.classificacoesLogisticas ?? [],
    });
    itens.push({
      id: varianteTecnica.variante.sku,
      title: produto.name,
      description: descricao,
      link,
      imageLink,
      availability: mapearDisponibilidadeSimples(
        modalidade,
        preco,
        varianteTecnica,
      ),
      price: { amountInCents: preco.precoFinalEmCentavos, currency: "BRL" },
      ...(brand ? { brand } : {}),
      ...(gtin ? { gtin } : {}),
      ...(mpnVariante || mpnProduto ? { mpn: mpnVariante ?? mpnProduto } : {}),
      ...(shippingLabel ? { shippingLabel } : {}),
      ...resolverPoliticaIdentificacaoMerchant(),
    });
  }
  return {
    itens: itens.sort((a, b) => a.id.localeCompare(b.id)),
    diagnosticos,
  };
}

/** Compatibilidade para o feed atual, que consome somente itens elegíveis. */
export async function montarItensMerchant(
  produtos: ProdutoFonteMerchant[],
  dependencias: {
    adaptarPrecos?: typeof adaptarPrecosVitrine;
  } = {},
): Promise<ItemMerchant[]> {
  const resultado = await montarResultadoItensMerchant(produtos, dependencias);
  return resultado.itens;
}
