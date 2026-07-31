import "server-only";

import { buscarProdutosParaAutocomplete } from "@/features/header/queries/busca-produtos";
import type { PrecoVitrineNormalizado } from "@/features/precificacao/server";
import {
  adaptarPrecosVitrine,
  normalizarModalidadePrecoCanonica,
} from "@/features/precificacao/server";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/domain";
import { consultarFreteAction } from "@/features/store/products/actions/consultarFreteAction";
import { resolverDisponibilidadeCompraPdp } from "@/features/store/products/lib/resolver-disponibilidade-compra-pdp";
import { buscarDadosCotacaoFreteLoja } from "@/features/store/products/queries/frete/buscar-dados-cotacao-frete-loja";
import { getProductBySlug } from "@/features/store/products/service/productService";

import type { ResultadoFerramentaPublica } from "../types/ferramentas-publicas";

type ProdutoPublico = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

function resultado(
  fonte: string,
  status: ResultadoFerramentaPublica["status"],
  dados: Record<string, unknown> | null,
): ResultadoFerramentaPublica {
  return {
    consultado_em: new Date().toISOString(),
    dados,
    fonte,
    status,
  };
}

function buscarVariantePublica(produto: ProdutoPublico, sku: string | null) {
  if (!sku) return null;
  if (produto.productKind !== "variable") return null;
  return (
    produto.variants.find(
      (variante) => variante.isActive && variante.sku === sku,
    ) ?? null
  );
}

async function selecionarPrecosPublicos(
  produto: ProdutoPublico,
  modalidade: string | null,
  skuVariante: string | null,
) {
  const variante = buscarVariantePublica(produto, skuVariante);
  if (skuVariante && !variante) return null;
  const precosVitrine = await adaptarPrecosVitrine([produto]);
  const precos = precosVitrine.produtosPorId[produto.id]?.precos ?? [];
  return {
    precos: precos.filter((preco) =>
      variante
        ? preco.varianteId === variante.id
        : !preco.varianteId && (!modalidade || preco.modalidade === modalidade),
    ),
    variante,
  };
}

function mapearPrecoPublico(precoVitrine: PrecoVitrineNormalizado) {
  const preco = precoVitrine.precificacao;
  return {
    boleto_ativo: preco.boleto.ativo,
    modalidade: preco.modalidade.startsWith("variant:")
      ? "variante"
      : preco.modalidade,
    moeda: preco.moeda,
    parcelamentos_cartao: preco.cartao.parcelamentos.map((parcela) => ({
      parcelas: parcela.parcelas,
      sem_juros: parcela.semJuros,
      total_em_centavos: parcela.totalEmCentavos,
      valor_parcela_em_centavos: parcela.valorParcelaEmCentavos,
    })),
    pix_ativo: preco.pix.ativo,
    preco_final_em_centavos: preco.precoFinalEmCentavos,
    preco_original_em_centavos: preco.precoOriginalEmCentavos,
    valor_pix_em_centavos: preco.pix.valorEmCentavos,
  };
}

/** Adaptador público: usa as mesmas consultas e motores empregados pela loja. */
export const fontesFerramentasPublicasOficiais = {
  async buscarProdutos(argumentos: { termo: string }) {
    const busca = await buscarProdutosParaAutocomplete({
      termoBusca: argumentos.termo,
    });
    return resultado(
      "catalogo_loja",
      busca.produtosEncontrados.length ? "encontrado" : "nenhum_resultado",
      {
        produtos: busca.produtosEncontrados.map((produto) => ({
          categoria: produto.categoriaNome,
          imagem_url: produto.imagemUrl,
          nome: produto.nome,
          preco_em_centavos: produto.precoEmCentavos,
          slug: produto.slug,
        })),
      },
    );
  },

  async consultarProduto(argumentos: { slug: string }) {
    const produto = await getProductBySlug(argumentos.slug);
    if (!produto) return resultado("catalogo_loja", "nenhum_resultado", null);

    return resultado("catalogo_loja", "encontrado", {
      atributos: produto.attributes.flatMap((atributo) =>
        atributo.values.map((valor) => ({ nome: atributo.name, valor })),
      ),
      categoria: null,
      descricao: produto.description,
      garantia_dias: produto.warrantyPeriod,
      marca: produto.brand,
      nome: produto.name,
      slug: produto.slug,
      tipo: produto.productKind === "variable" ? "variavel" : "simples",
      variantes:
        produto.productKind === "variable"
          ? produto.variants
              .filter((variante) => variante.isActive)
              .map((variante) => ({
                atributos: variante.attributes,
                nome: variante.name,
                sku: variante.sku,
              }))
          : [],
    });
  },

  async consultarPrecos(argumentos: {
    modalidade: string | null;
    sku_variante: string | null;
    slug: string;
  }) {
    const produto = await getProductBySlug(argumentos.slug);
    if (!produto)
      return resultado("precificacao_loja", "nenhum_resultado", null);
    const selecao = await selecionarPrecosPublicos(
      produto,
      argumentos.modalidade,
      argumentos.sku_variante,
    );
    if (!selecao)
      return resultado("precificacao_loja", "nenhum_resultado", null);
    if (!selecao.precos.length) {
      return resultado("precificacao_loja", "dado_indisponivel", null);
    }
    return resultado("precificacao_loja", "encontrado", {
      precos: selecao.precos.map(mapearPrecoPublico),
      produto: produto.name,
      variante: selecao.variante?.sku ?? null,
    });
  },

  async consultarEstoque(argumentos: {
    modalidade: string | null;
    sku_variante: string | null;
    slug: string;
  }) {
    const produto = await getProductBySlug(argumentos.slug);
    if (!produto) return resultado("estoque_loja", "nenhum_resultado", null);
    const selecao = await selecionarPrecosPublicos(
      produto,
      argumentos.modalidade,
      argumentos.sku_variante,
    );
    if (!selecao) return resultado("estoque_loja", "nenhum_resultado", null);
    const preco = selecao.precos[0]?.precificacao ?? null;
    const varianteTecnica =
      produto.productKind === "variable"
        ? null
        : identificarVarianteTecnicaProdutoSimples({
            skuProduto: produto.sku,
            variantes: produto.variants.map((variante) => ({
              ativa: variante.isActive,
              atributos: variante.attributes,
              estoque: variante.stockQuantity,
              id: variante.id,
              precoEmCentavos: variante.priceInCents,
              principal: variante.isDefault,
              sku: variante.sku,
            })),
          });
    const modalidadeBanco =
      produto.pricing.find(
        (item) =>
          item.isActive &&
          (!argumentos.modalidade || item.type === argumentos.modalidade),
      ) ?? null;
    const modalidadeCanonica = normalizarModalidadePrecoCanonica(
      modalidadeBanco?.type,
    );
    const modalidade =
      modalidadeBanco && modalidadeCanonica
        ? {
            deliveryDays: modalidadeBanco.deliveryDays,
            hasPromo: Boolean(modalidadeBanco.hasPromo),
            isActive: Boolean(modalidadeBanco.isActive),
            mainCardPrice: Boolean(modalidadeBanco.mainCardPrice),
            price: modalidadeBanco.price,
            pricingModalDescription: modalidadeBanco.pricingModalDescription,
            promoEndDate: modalidadeBanco.promoEndDate,
            promoPrice: modalidadeBanco.promoPrice,
            promoType: (modalidadeBanco.promoType === "flash" ||
            modalidadeBanco.promoType === "normal"
              ? modalidadeBanco.promoType
              : null) as "flash" | "normal" | null,
            type: modalidadeCanonica,
          }
        : null;
    const disponibilidade = resolverDisponibilidadeCompraPdp({
      modalidade,
      possuiVariantesPublicas: produto.variants.some(
        (variante) => variante.isActive,
      ),
      precoCalculado: preco,
      tipoProduto: produto.productKind,
      varianteSelecionada: selecao.variante,
      varianteTecnicaProdutoSimples: varianteTecnica,
    });
    return resultado("estoque_loja", "encontrado", {
      disponibilidade: disponibilidade.estado,
      modalidade: modalidade?.type ?? argumentos.modalidade,
      produto: produto.name,
      variante: selecao.variante?.sku ?? null,
    });
  },

  async consultarPromocoes(argumentos: {
    modalidade: string | null;
    sku_variante: string | null;
    slug: string;
  }) {
    const produto = await getProductBySlug(argumentos.slug);
    if (!produto)
      return resultado("promotion_engine", "nenhum_resultado", null);
    const selecao = await selecionarPrecosPublicos(
      produto,
      argumentos.modalidade,
      argumentos.sku_variante,
    );
    if (!selecao)
      return resultado("promotion_engine", "nenhum_resultado", null);
    const promocoes = selecao.precos
      .filter((preco) => preco.possuiPromocao)
      .map((preco) => ({
        badge: preco.badgePromocional,
        desconto_em_centavos: preco.descontoAplicadoEmCentavos,
        preco_final_em_centavos: preco.precoFinalEmCentavos,
        preco_original_em_centavos: preco.precoOriginalEmCentavos,
        termina_em: preco.countdownPromocional.dataFim?.toISOString() ?? null,
        tipo:
          preco.tipoCampanhaPromocional === "oferta_relampago"
            ? ("relampago" as const)
            : preco.possuiPromocao
              ? ("normal" as const)
              : null,
      }));
    return resultado(
      "promotion_engine",
      promocoes.length ? "encontrado" : "nenhum_resultado",
      {
        modalidade: argumentos.modalidade,
        produto: produto.name,
        promocoes,
        variante: selecao.variante?.sku ?? null,
      },
    );
  },

  async consultarLogistica(argumentos: {
    cep: string;
    modalidade: string | null;
    quantidade: number;
    sku_variante: string | null;
    slug: string;
  }) {
    const produto = await getProductBySlug(argumentos.slug);
    if (!produto) return resultado("logistica_loja", "nenhum_resultado", null);
    const variante = buscarVariantePublica(produto, argumentos.sku_variante);
    if (argumentos.sku_variante && !variante) {
      return resultado("logistica_loja", "nenhum_resultado", null);
    }
    const [frete, dadosCotacao] = await Promise.all([
      consultarFreteAction(
        produto.id,
        argumentos.cep,
        variante?.id,
        argumentos.quantidade,
        argumentos.modalidade,
      ),
      buscarDadosCotacaoFreteLoja(produto.id, variante?.id),
    ]);
    const entregas = (frete.opcoesEntrega ?? []).map((opcao) => ({
      nome: opcao.nome,
      prazo: opcao.prazo,
      tipo: "entrega" as const,
      valor_em_centavos: opcao.valorEmCentavos,
    }));
    const retiradas = (dadosCotacao?.retiradasAtuais ?? []).map((retirada) => ({
      nome: retirada.nome,
      prazo: retirada.descricao ?? null,
      tipo: "retirada" as const,
      valor_em_centavos: 0,
    }));
    const opcoes = [...entregas, ...retiradas];
    return resultado(
      "logistica_loja",
      opcoes.length ? "encontrado" : "nenhum_resultado",
      {
        opcoes,
        produto: produto.name,
        variante: variante?.sku ?? null,
      },
    );
  },
};

export type FontesFerramentasPublicas =
  typeof fontesFerramentasPublicasOficiais;
