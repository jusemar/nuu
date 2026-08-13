// ==========================================
// ORQUESTRADOR: ProductDetailsPage (CORRIGIDO - ESTADO GLOBAL)
// ==========================================
// Responsabilidade: Juntar todos os componentes da página de produto
//
// O QUE MUDOU:
//   - Removido seletor de teste da coluna 3 (era duplicado)
//   - Estado de modalidade elevado para cá (orquestrador)
//   - ProductInfo e BuyBox compartilham o MESMO estado via props
//   - Quando clica em uma modalidade no ProductInfo, BuyBox atualiza automaticamente
//
// FLUXO DE DADOS:
//   1. Hook useProductPricing gerencia o estado
//   2. ProductDetailsPage passa o estado para ProductInfo (coluna 2)
//   3. Mesmo estado passado para BuyBox (coluna 3)
//   4. Clique no ProductInfo → chama onTrocarModalidade → hook atualiza → BuyBox recebe novo preço

"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { CategoryBreadcrumb } from "@/components/common/category-breadcrumb";
import { Footer } from "@/components/common/footer";
import type { NovoItemCarrinho } from "@/features/carrinho";
import { useCarrinho } from "@/features/carrinho";
import { Header } from "@/features/header";
import type { PrecosProdutoPorModalidade } from "@/features/precificacao/client";
import { identificarVarianteTecnicaProdutoSimples } from "@/features/products/domain";
import { BannerPromocaoProdutoPdp } from "@/features/promocoes/components/store/banner-promocao-produto-pdp";

import { useProductPricing } from "../hooks/useProductPricing";
import { formatarPromocaoPrecoPdp } from "../lib/promocoes/formatar-promocao-preco-pdp";
import { resolverDisponibilidadeCompraPdp } from "../lib/resolver-disponibilidade-compra-pdp";
import type { ProdutoRelacionadoPdp } from "../queries/buscar-produtos-relacionados-pdp";
import type { ProdutoVendaCruzadaPdp } from "../queries/venda-cruzada/buscar-venda-cruzada-pdp";
import type {
  AtributoProdutoLoja,
  Avaliacao,
  Especificacao,
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../types/product.types";
import { stripProductRichText } from "../utils/rich-text";
import {
  beneficiosConfiancaCompraPdp,
  BeneficiosProdutoPdp,
} from "./beneficios-produto-pdp";
import { BuyBox } from "./buy-box";
import { PaginaProdutoAprovada } from "./pagina-produto-aprovada";
import { PaymentModal } from "./payment-modal";
import { PricingModalities } from "./PricingModalities";
import { ProductGallery } from "./product-gallery";
import { DescricaoCurtaProdutoPdp, ProductInfo } from "./product-info";
import type { ModalidadeInfo } from "./product-tabs";
import { ProductTabs } from "./product-tabs";
import { UpsellSection } from "./upsell-section";
import { VendaCruzadaPdp } from "./venda-cruzada-pdp";

// ==========================================
// INTERFACE DAS PROPS
// ==========================================
interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    cardShortText: string | null;
    brand: string | null;
    sku: string;
    ncmCode: string | null;
    productKind?: string | null;
    allowsPickup: boolean | null;
    prazoRetiradaCustom: string | null;
    allowsOwnDelivery: boolean | null;
    weight: number | null;
    height: number | null;
    width: number | null;
    length: number | null;
    galleryImages?: Array<{
      id: string;
      imageUrl: string;
      altText: string | null;
      isPrimary: boolean | null;
      sortOrder: number | string | null;
    }>;
    pricing?: PrecoModalidade[];
    attributes?: AtributoProdutoLoja[];
    variants?: VarianteProdutoLoja[];
    modeloRetirada?: {
      id: string;
      nome: string;
      prazoTexto: string;
      mensagem: string | null;
      ativo: boolean | null;
    } | null;
  };
  nomeComercialLoja: string | null;
  breadcrumbCategorias: Array<{ id: string; name: string; slug: string }>;
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
  precosCalculadosPorVariante: PrecosProdutoPorModalidade;
  /** Mantém a PDP pública intacta enquanto a nova composição é validada. */
  modoPreVisualizacao?: boolean;
  /** Legado temporário da composição anterior, preservado sem uso no layout aprovado. */
  conteudoComplementar?: ReactNode;
  /** Selo de pagamento na entrega, renderizado no servidor e recebido pronto. */
  /**
   * Identificadores dos serviços de entrega própria que aceitam pagamento na entrega.
   * Decidido no servidor pelo motor de elegibilidade; aqui só desce até o card da
   * modalidade correspondente na buy-box.
   */
  servicosComPagamentoNaEntrega?: string[];
  produtosRelacionados?: ProdutoRelacionadoPdp[];
  produtosVendaCruzada?: ProdutoVendaCruzadaPdp[];
  bannerInstitucionalProduto?: ReactNode;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductDetail({
  product,
  nomeComercialLoja,
  breadcrumbCategorias,
  precosCalculadosPorModalidade,
  precosCalculadosPorVariante,
  modoPreVisualizacao = false,
  conteudoComplementar,
  servicosComPagamentoNaEntrega = [],
  produtosRelacionados,
  produtosVendaCruzada,
  bannerInstitucionalProduto,
}: ProductDetailProps) {
  const { adicionarItem } = useCarrinho();
  const router = useRouter();

  // -----------------------------------------
  // ESTADOS GLOBAIS DA PÁGINA
  // -----------------------------------------
  // modalPgto: controla se o modal de pagamento está aberto
  const [modalPgto, setModalPgto] = useState(false);
  // cupomAplicado: cupom de desconto ativo (ainda mock)
  const [cupomAplicado, setCupomAplicado] = useState<null | {
    desconto: number;
    label: string;
    code: string;
  }>(null);
  const publicVariants = (product.variants || []).filter(
    (variant) => variant.isActive,
  );
  const varianteTecnicaProdutoSimples =
    product.productKind !== "variable"
      ? identificarVarianteTecnicaProdutoSimples({
          skuProduto: product.sku,
          variantes: (product.variants || []).map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            atributos: variant.attributes,
            precoEmCentavos: variant.priceInCents,
            estoque: variant.stockQuantity,
            ativa: variant.isActive,
            principal: variant.isDefault,
          })),
        })
      : null;
  const [selectedVariant, setSelectedVariant] =
    useState<VarianteProdutoLoja | null>(null);
  const [quantidadePrincipal, setQuantidadePrincipal] = useState(1);
  const [fretePrincipal, setFretePrincipal] = useState<
    NovoItemCarrinho["freteEscolhido"] | null
  >(null);
  const hasSelectedVariant =
    product.productKind === "variable" && Boolean(selectedVariant);

  // -----------------------------------------
  // HOOK: Gerenciamento de preços e modalidades (ESTADO GLOBAL)
  // -----------------------------------------
  // Este hook é a FONTE ÚNICA DA VERDADE para preços
  // Ele mantém qual modalidade está ativa e calcula os preços formatados
  const {
    modalidadeAtiva, // Objeto da modalidade selecionada (ex: stock)
    modalidadesDisponiveis, // Array com todas as modalidades ativas do DB
    selecionarModalidade, // Função para trocar de modalidade
    precoPixFormatado, // "R$ 51,51" (preço atual formatado)
    precoNormalFormatado, // "R$ 59,24" (preço no cartão)
    precoParceladoFormatado, // "3x de R$ 17,17" (parcelamento)
    descontoPix, // 13 (% de desconto PIX)
    prazoEntrega, // "imediato" (prazo da modalidade ativa)
  } = useProductPricing(product.pricing || [], precosCalculadosPorModalidade);

  const parcelamentosCartao =
    precosCalculadosPorModalidade[modalidadeAtiva.type]?.cartao.parcelamentos ||
    [];
  const precoVarianteSelecionada = selectedVariant
    ? precosCalculadosPorVariante[`variant:${selectedVariant.id}`]
    : null;
  const parcelamentosVariante =
    precoVarianteSelecionada?.cartao.parcelamentos || [];
  const precoModalidadeAtivaCalculado =
    precosCalculadosPorModalidade[modalidadeAtiva.type];
  const precoCompraCalculado =
    precoVarianteSelecionada ?? precoModalidadeAtivaCalculado;
  const disponibilidadeCompra = resolverDisponibilidadeCompraPdp({
    tipoProduto: product.productKind,
    modalidade: modalidadeAtiva,
    precoCalculado: precoCompraCalculado,
    varianteSelecionada: selectedVariant,
    possuiVariantesPublicas: publicVariants.length > 0,
    varianteTecnicaProdutoSimples,
  });
  const promocaoVisualModalidadeAtiva = formatarPromocaoPrecoPdp(
    precoModalidadeAtivaCalculado,
  );
  const promocaoVisualVarianteSelecionada = formatarPromocaoPrecoPdp(
    precoVarianteSelecionada,
  );
  const promocaoVisualCompra =
    promocaoVisualVarianteSelecionada ?? promocaoVisualModalidadeAtiva;
  const descontoPixVariante = precoVarianteSelecionada
    ? Math.round(
        (1 -
          precoVarianteSelecionada.pix.valorEmCentavos /
            precoVarianteSelecionada.cartao.valorEmCentavos) *
          100,
      )
    : descontoPix;

  const dataFimPromocaoModalidadeAtiva = converterDataPromocao(
    modalidadeAtiva.promoEndDate,
  );
  const relampagoAtivoModalidadeAtiva = isOfertaRelampagoAtiva(modalidadeAtiva);
  const promocaoNormalAtivaModalidadeAtiva =
    modalidadeAtiva.hasPromo &&
    modalidadeAtiva.promoPrice !== null &&
    modalidadeAtiva.promoType !== "flash";
  const tipoBadgeGaleria: "relampago" | "promocao" | null =
    relampagoAtivoModalidadeAtiva
      ? "relampago"
      : promocaoNormalAtivaModalidadeAtiva || promocaoVisualCompra?.ativa
        ? "promocao"
        : null;

  // -----------------------------------------
  // RETIRADA LOCAL: Dados reais do banco
  // -----------------------------------------
  // Só mostra se o produto tem retirada habilitada E tem modelo selecionado
  const retiradaLocal =
    product.allowsPickup && product.modeloRetirada
      ? {
          nome: product.modeloRetirada.nome,
          prazo:
            product.prazoRetiradaCustom || product.modeloRetirada.prazoTexto,
          mensagem: product.modeloRetirada.mensagem,
        }
      : null;

  // -----------------------------------------
  // IMAGENS: Processamento e ordenação
  // -----------------------------------------
  // 1. Filtra imagens sem URL
  // 2. Ordena por sortOrder (converte string para number se necessário)
  // 3. Extrai apenas as URLs (strings) para o ProductGallery
  const productImages = (product.galleryImages || [])
    .filter((img) => img.imageUrl && img.imageUrl.trim() !== "")
    .sort((a, b) => {
      const orderA =
        typeof a.sortOrder === "string"
          ? parseInt(a.sortOrder, 10) || 0
          : a.sortOrder || 0;
      const orderB =
        typeof b.sortOrder === "string"
          ? parseInt(b.sortOrder, 10) || 0
          : b.sortOrder || 0;
      return orderA - orderB;
    })
    .map((img) => img.imageUrl);

  const imagemVarianteResolvida = resolverImagemVariante({
    varianteSelecionada: selectedVariant,
    variantes: publicVariants,
  });

  // Fallback: se não tiver imagens no DB, usa mock temporário
  const galleryImagesBase =
    productImages.length > 0 ? productImages : ["/produto-sem-foto.webp"];
  const galleryImages =
    imagemVarianteResolvida &&
    !galleryImagesBase.includes(imagemVarianteResolvida)
      ? [imagemVarianteResolvida, ...galleryImagesBase]
      : galleryImagesBase;

  // -----------------------------------------
  // DESCRIÇÕES: Curta e longa
  // -----------------------------------------
  // Descrição curta: usa cardShortText se existir, senão description
  const productCardShortText = product.cardShortText?.trim();
  const productShortDescription = productCardShortText
    ? stripProductRichText(productCardShortText)
    : stripProductRichText(product.description);

  // Descrição longa: sempre a description completa (para abas)
  const productLongDescription = product.description;
  const especificacoesProduto = mapearEspecificacoesProduto(product.attributes);
  const medidasEPeso = mapearMedidasEPesoProduto({
    peso: product.weight,
    altura: product.height,
    largura: product.width,
    comprimento: product.length,
  });
  const ncm = product.ncmCode?.trim();
  const dadosFiscaisEComerciais: Especificacao[] = ncm
    ? [{ label: "NCM", valor: ncm }]
    : [];
  const avaliacoesProduto: Avaliacao[] = [];
  const ratingProduto = calcularRating(avaliacoesProduto);
  const totalAvaliacoesProduto = avaliacoesProduto.length;

  // -----------------------------------------
  // HANDLERS: Ações do usuário
  // -----------------------------------------

  // Aplica cupom de desconto (ainda mock - futuro: validar no backend)
  function aplicarCupom(codigo: string) {
    void codigo;
  }

  // Remove cupom aplicado
  function removerCupom() {
    setCupomAplicado(null);
  }

  function montarItemCarrinhoProduto(
    quantidade: number,
    freteEscolhido?: {
      id: "retirada" | "entrega-propria" | "frenet";
      nome: string;
      prazo: string;
      valorEmCentavos: number;
      cep?: string;
      servico?: string;
    },
  ): NovoItemCarrinho | null {
    if (!modalidadeAtiva) return null;

    if (product.productKind === "variable" && !selectedVariant) {
      return null;
    }

    const precoEmCentavos = hasSelectedVariant
      ? selectedVariant!.priceInCents
      : obterPrecoModalidadeVigente(modalidadeAtiva);
    const descricaoVariante = selectedVariant
      ? selectedVariant.name ||
        Object.values(selectedVariant.attributes).filter(Boolean).join(" / ")
      : modalidadeAtiva.pricingModalDescription || modalidadeAtiva.type;

    return {
      produtoId: product.id,
      produtoVarianteId:
        selectedVariant?.id ||
        (varianteTecnicaProdutoSimples?.situacao === "confiavel"
          ? varianteTecnicaProdutoSimples.variante.id
          : undefined),
      produtoSlug: product.slug,
      produtoUrl: `/product/${product.slug}`,
      nome: product.name,
      sku: selectedVariant?.sku || product.sku,
      modalidadeTipo: modalidadeAtiva.type,
      modalidadeTitulo:
        tituloModalidadePorTipo[modalidadeAtiva.type] ||
        (!textoParecePrazo(modalidadeAtiva.pricingModalDescription)
          ? modalidadeAtiva.pricingModalDescription
          : null) ||
        modalidadeAtiva.type,
      variante: descricaoVariante,
      atributosVariante: selectedVariant?.attributes,
      prazoModalidade: modalidadeAtiva.deliveryDays || "Consulte prazo",
      imagemUrl: galleryImages[0] || "/produto-sem-foto.webp",
      precoEmCentavos,
      estoqueDisponivel:
        selectedVariant?.stockQuantity ??
        (varianteTecnicaProdutoSimples?.situacao === "confiavel"
          ? varianteTecnicaProdutoSimples.variante.estoque
          : undefined),
      pesoEmGramas: selectedVariant?.weightInGrams,
      alturaEmCm: selectedVariant?.heightInCm,
      larguraEmCm: selectedVariant?.widthInCm,
      comprimentoEmCm: selectedVariant?.lengthInCm,
      freteEscolhido,
      quantidade,
    };
  }

  function adicionarProdutoAoCarrinho(
    quantidade: number,
    freteEscolhido?: {
      id: "retirada" | "entrega-propria" | "frenet";
      nome: string;
      prazo: string;
      valorEmCentavos: number;
      cep?: string;
      servico?: string;
    },
  ) {
    const itemCarrinho = montarItemCarrinhoProduto(quantidade, freteEscolhido);

    if (!itemCarrinho) return;

    // A página de produto só monta o item; persistência e abertura da gaveta ficam no domínio carrinho.
    adicionarItem(itemCarrinho);
  }

  function comprarProdutoAgora(
    quantidade: number,
    freteEscolhido?: {
      id: "retirada" | "entrega-propria" | "frenet";
      nome: string;
      prazo: string;
      valorEmCentavos: number;
      cep?: string;
      servico?: string;
    },
  ) {
    const itemCarrinho = montarItemCarrinhoProduto(quantidade, freteEscolhido);

    if (!itemCarrinho) return;

    adicionarItem(itemCarrinho, { abrirGaveta: false });
    router.push("/checkout");
  }

  // -----------------------------------------
  // RENDER: Composição dos componentes
  // -----------------------------------------
  const abasProduto = (
    <ProductTabs
      className={modoPreVisualizacao ? "mt-8" : undefined}
      descricao={productLongDescription}
      especificacoes={especificacoesProduto}
      medidasEPeso={medidasEPeso}
      dadosFiscaisEComerciais={dadosFiscaisEComerciais}
      avaliacoes={avaliacoesProduto}
      rating={ratingProduto}
      totalAvaliacoes={totalAvaliacoesProduto}
      modalidades={modalidadesDisponiveis.reduce(
        (acc, mod) => {
          acc[mod.type] = {
            icon:
              mod.type === "stock"
                ? "🏭"
                : mod.type === "pre_sale"
                  ? "⏳"
                  : mod.type === "dropshipping"
                    ? "📦"
                    : "📋",
            label: mod.pricingModalDescription || mod.type,
            prazo: mod.deliveryDays || "Consulte prazo",
            garantia: "12 meses",
            envia: "Brasil",
          };
          return acc;
        },
        {} as Record<string, ModalidadeInfo>,
      )}
    />
  );

  if (modoPreVisualizacao) {
    return (
      <PaginaProdutoAprovada
        bannerInstitucionalProduto={bannerInstitucionalProduto}
        produtoId={product.id}
        produtoSlug={product.slug}
        nomeProduto={product.name}
        imagemProduto={galleryImages[0]}
        breadcrumbCategorias={breadcrumbCategorias}
        modoPreVisualizacao
        galeria={
          <ProductGallery
            imagens={galleryImages}
            nomeProduto={product.name}
            isLancamento={true}
            tipoBadge={tipoBadgeGaleria}
            dataFimRelampago={dataFimPromocaoModalidadeAtiva}
            modoPreVisualizacao
          />
        }
        demaisInformacoesCompra={
          <BeneficiosProdutoPdp beneficios={beneficiosConfiancaCompraPdp} />
        }
        descricaoCurta={
          <DescricaoCurtaProdutoPdp
            descricao={productShortDescription}
            modoPreVisualizacao
          />
        }
        informacoes={
          <ProductInfo
            nome={product.name}
            marca={product.brand || ""}
            sku={product.sku}
            rating={ratingProduto}
            totalAvaliacoes={totalAvaliacoesProduto}
            vendedor={nomeComercialLoja || undefined}
            vendedorRating={0}
            descricao={productShortDescription}
            modalidadesDisponiveis={modalidadesDisponiveis}
            modalidadeAtiva={modalidadeAtiva}
            onTrocarModalidade={selecionarModalidade}
            precosCalculadosPorModalidade={precosCalculadosPorModalidade}
            productKind={product.productKind}
            variantAttributes={product.attributes}
            variants={publicVariants}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            modoAssistenteVirtual
            modoPreVisualizacao
            mostrarDescricao={false}
          />
        }
        caixaCompra={
          <BuyBox
            productId={product.id}
            varianteIdSelecionada={selectedVariant?.id}
            precoPix={precoVarianteSelecionada?.pix.valor || precoPixFormatado}
            precoNormal={
              precoVarianteSelecionada?.cartao.valor || precoNormalFormatado
            }
            precoParc={
              parcelamentosVariante[0]
                ? `${parcelamentosVariante[0].parcelas}x de ${parcelamentosVariante[0].valor}`
                : precoParceladoFormatado
            }
            descontoPix={descontoPixVariante}
            promocaoVisual={promocaoVisualCompra}
            prazoEntrega={prazoEntrega}
            disponibilidadeCompra={disponibilidadeCompra}
            precoCalculado={precoCompraCalculado}
            selectedVariantLabel={
              selectedVariant
                ? selectedVariant.name ||
                  Object.values(selectedVariant?.attributes || {}).join(" / ")
                : null
            }
            retiradaLocal={retiradaLocal}
            allowsOwnDelivery={!!product.allowsOwnDelivery}
            servicosComPagamentoNaEntrega={servicosComPagamentoNaEntrega}
            cupomAplicado={cupomAplicado}
            onAplicarCupom={aplicarCupom}
            onRemoverCupom={removerCupom}
            onAddToCart={adicionarProdutoAoCarrinho}
            onComprarAgora={comprarProdutoAgora}
            onShowPaymentOptions={() => setModalPgto(true)}
            modalidades={modalidadesDisponiveis}
            modalidadeAtiva={modalidadeAtiva}
            onTrocarModalidade={selecionarModalidade}
            modoPreVisualizacao
            mostrarFreteDemonstrativo
            mostrarBeneficiosConfianca={false}
            seletorModalidades={
              product.productKind !== "variable" &&
              modalidadesDisponiveis.length > 0 ? (
                <PricingModalities
                  modalidades={modalidadesDisponiveis}
                  modalidadeAtiva={modalidadeAtiva}
                  onSelecionarModalidade={selecionarModalidade}
                  precosCalculadosPorModalidade={precosCalculadosPorModalidade}
                />
              ) : null
            }
          />
        }
        abas={<ProductTabs {...abasProduto.props} className="mt-0" />}
        produtosRelacionados={produtosRelacionados}
        vendaCruzada={undefined}
        modalPagamento={
          <PaymentModal
            isOpen={modalPgto}
            onClose={() => setModalPgto(false)}
            parcelamentos={
              parcelamentosVariante.length > 0
                ? parcelamentosVariante
                : parcelamentosCartao
            }
            precoCalculado={precoCompraCalculado}
          />
        }
      />
    );
  }

  const rotuloVarianteSelecionada = selectedVariant
    ? selectedVariant.name ||
      Object.values(selectedVariant.attributes).join(" / ")
    : null;

  return (
    <PaginaProdutoAprovada
      bannerInstitucionalProduto={bannerInstitucionalProduto}
      produtoId={product.id}
      produtoSlug={product.slug}
      nomeProduto={product.name}
      imagemProduto={galleryImages[0]}
      breadcrumbCategorias={breadcrumbCategorias}
      demaisInformacoesCompra={
        <BeneficiosProdutoPdp beneficios={beneficiosConfiancaCompraPdp} />
      }
      descricaoCurta={
        <DescricaoCurtaProdutoPdp
          descricao={productShortDescription}
          modoPreVisualizacao={true}
        />
      }
      galeria={
        <ProductGallery
          imagens={galleryImages}
          nomeProduto={product.name}
          isLancamento={true}
          tipoBadge={tipoBadgeGaleria}
          dataFimRelampago={dataFimPromocaoModalidadeAtiva}
          modoPreVisualizacao={true}
          mostrarMarcaPrevisualizacao={false}
        />
      }
      mensagemPromocional={
        <BannerPromocaoProdutoPdp promocao={promocaoVisualCompra} />
      }
      informacoes={
        <ProductInfo
          nome={product.name}
          marca={product.brand || ""}
          sku={product.sku}
          rating={ratingProduto}
          totalAvaliacoes={totalAvaliacoesProduto}
          vendedor={nomeComercialLoja || undefined}
          vendedorRating={0}
          descricao={productShortDescription}
          modalidadesDisponiveis={modalidadesDisponiveis}
          modalidadeAtiva={modalidadeAtiva}
          onTrocarModalidade={selecionarModalidade}
          precosCalculadosPorModalidade={precosCalculadosPorModalidade}
          productKind={product.productKind}
          variantAttributes={product.attributes}
          variants={publicVariants}
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariant}
          modoPreVisualizacao={true}
          mostrarDescricao={false}
        />
      }
      caixaCompra={
        <BuyBox
          productId={product.id}
          varianteIdSelecionada={selectedVariant?.id}
          precoPix={precoVarianteSelecionada?.pix.valor || precoPixFormatado}
          precoNormal={
            precoVarianteSelecionada?.cartao.valor || precoNormalFormatado
          }
          precoParc={
            parcelamentosVariante[0]
              ? `${parcelamentosVariante[0].parcelas}x de ${parcelamentosVariante[0].valor}`
              : precoParceladoFormatado
          }
          descontoPix={descontoPixVariante}
          promocaoVisual={promocaoVisualCompra}
          prazoEntrega={prazoEntrega}
          disponibilidadeCompra={disponibilidadeCompra}
          precoCalculado={precoCompraCalculado}
          selectedVariantLabel={rotuloVarianteSelecionada}
          retiradaLocal={retiradaLocal}
          allowsOwnDelivery={!!product.allowsOwnDelivery}
          servicosComPagamentoNaEntrega={servicosComPagamentoNaEntrega}
          cupomAplicado={cupomAplicado}
          onAplicarCupom={aplicarCupom}
          onRemoverCupom={removerCupom}
          onAddToCart={adicionarProdutoAoCarrinho}
          onComprarAgora={comprarProdutoAgora}
          onShowPaymentOptions={() => setModalPgto(true)}
          onQuantidadeChange={setQuantidadePrincipal}
          onFreteEscolhidoChange={setFretePrincipal}
          modalidades={modalidadesDisponiveis}
          modalidadeAtiva={modalidadeAtiva}
          onTrocarModalidade={selecionarModalidade}
          modoPreVisualizacao={true}
          mostrarFreteDemonstrativo={false}
          mostrarBeneficiosConfianca={false}
          mostrarBannerPromocaoNoPreco={false}
          seletorModalidades={
            product.productKind !== "variable" &&
            modalidadesDisponiveis.length > 0 ? (
              <PricingModalities
                modalidades={modalidadesDisponiveis}
                modalidadeAtiva={modalidadeAtiva}
                onSelecionarModalidade={selecionarModalidade}
                precosCalculadosPorModalidade={precosCalculadosPorModalidade}
              />
            ) : null
          }
        />
      }
      abas={<ProductTabs {...abasProduto.props} className="mt-0" />}
      produtosRelacionados={produtosRelacionados}
      vendaCruzada={
        <VendaCruzadaPdp
          produtos={produtosVendaCruzada ?? []}
          itemPrincipal={montarItemCarrinhoProduto(
            quantidadePrincipal,
            fretePrincipal ?? undefined,
          )}
          freteEscolhido={fretePrincipal}
          precoPrincipalEmCentavos={
            precoCompraCalculado?.pix.ativo
              ? precoCompraCalculado.pix.valorEmCentavos
              : null
          }
          quantidadePrincipal={quantidadePrincipal}
        />
      }
      modalPagamento={
        <PaymentModal
          isOpen={modalPgto}
          onClose={() => setModalPgto(false)}
          parcelamentos={
            parcelamentosVariante.length > 0
              ? parcelamentosVariante
              : parcelamentosCartao
          }
          precoCalculado={precoCompraCalculado}
        />
      }
    />
  );

  /* Composição anterior preservada temporariamente abaixo para facilitar a
   * auditoria da restauração. Não é alcançada: a PDP usa o layout aprovado. */
  return (
    <div
      data-modo-pdp-preview={modoPreVisualizacao ? "true" : undefined}
      className="bg-surface-bg text-text-primary min-h-screen font-sans"
    >
      {/* HEADER: Navegação principal do site */}
      <Header />

      {/* BREADCRUMB: Indica onde o usuário está (Home > Categoria > Produto) */}
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <CategoryBreadcrumb
          categories={breadcrumbCategorias}
          currentPage={product.name}
          className="text-xs"
          currentPageClassName="text-primary font-semibold"
        />
      </div>

      {/* CONTEÚDO PRINCIPAL: Grid de 3 colunas */}
      <main
        className={
          modoPreVisualizacao
            ? "mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-8"
            : "mx-auto max-w-7xl px-4 pb-20 sm:px-6"
        }
      >
        {modoPreVisualizacao ? (
          <section className="border-primary/15 from-primary/10 mb-6 overflow-hidden rounded-3xl border bg-gradient-to-r via-white to-white px-5 py-5 sm:px-7">
            <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
              Pré-visualização
            </p>
            <h2 className="text-text-primary mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Nova experiência de compra
            </h2>
            <p className="text-text-muted mt-1 max-w-2xl text-sm">
              Informações, escolha de modalidade e compra organizadas para uma
              comparação mais direta.
            </p>
          </section>
        ) : null}
        <div
          className={
            modoPreVisualizacao
              ? "grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(300px,45%)_1fr] xl:grid-cols-[minmax(320px,420px)_minmax(360px,1fr)_minmax(380px,460px)] xl:gap-7"
              : "grid grid-cols-1 items-start gap-6 sm:px-6 md:grid-cols-[minmax(300px,45%)_1fr] xl:grid-cols-[minmax(300px,420px)_minmax(400px,2fr)_minmax(280px,320px)]"
          }
        >
          {/* ==========================================
              COLUNA 1: GALERIA DE IMAGENS
              Recebe: array de URLs (strings)
              ========================================== */}
          <div
            className={
              modoPreVisualizacao
                ? "border-surface-border order-1 rounded-3xl border bg-white p-3 shadow-sm xl:max-w-[440px]"
                : "order-1 xl:max-w-[420px]"
            }
          >
            <ProductGallery
              imagens={galleryImages}
              nomeProduto={product.name}
              isLancamento={true}
              tipoBadge={tipoBadgeGaleria}
              dataFimRelampago={dataFimPromocaoModalidadeAtiva}
            />
            {!modoPreVisualizacao && promocaoVisualCompra ? (
              <div className="mt-3">
                <BannerPromocaoProdutoPdp promocao={promocaoVisualCompra} />
              </div>
            ) : null}
          </div>

          {/* ==========================================
              COLUNA 2: INFORMAÇÕES DO PRODUTO
              NOVO: Recebe estado GLOBAL de modalidades do hook
              Antes: ProductInfo tinha estado interno (não comunicava com BuyBox)
              Agora: Compartilha o mesmo estado do BuyBox via props
              ========================================== */}
          <div
            className={
              modoPreVisualizacao
                ? "border-surface-border order-2 rounded-3xl border bg-white p-5 shadow-sm sm:p-6"
                : "order-2"
            }
          >
            <ProductInfo
              // Dados básicos do produto
              nome={product.name}
              marca={product.brand || ""}
              sku={product.sku}
              rating={ratingProduto}
              totalAvaliacoes={totalAvaliacoesProduto}
              vendedor={nomeComercialLoja || undefined}
              vendedorRating={0}
              descricao={productShortDescription}
              // === ESTADO GLOBAL DE MODALIDADES (NOVO) ===
              // Antes: ProductInfo gerenciava sozinho (estado local)
              // Agora: Recebe do pai e comunica mudanças via callback
              modalidadesDisponiveis={modalidadesDisponiveis} // Array de modalidades
              modalidadeAtiva={modalidadeAtiva} // Qual está selecionada
              onTrocarModalidade={selecionarModalidade} // Função para trocar
              precosCalculadosPorModalidade={precosCalculadosPorModalidade}
              productKind={product.productKind}
              variantAttributes={product.attributes}
              variants={publicVariants}
              selectedVariant={selectedVariant}
              onSelectVariant={setSelectedVariant}
              modoAssistenteVirtual={modoPreVisualizacao}
            />
          </div>

          {/* ==========================================
              COLUNA 3: BUY BOX (CAIXA DE COMPRA)
              Recebe: Mesmo estado global da coluna 2
              Resultado: Quando clica no ProductInfo, BuyBox atualiza automaticamente
              ========================================== */}
          <div
            className={
              modoPreVisualizacao
                ? "border-primary/15 order-3 rounded-3xl border bg-white p-2 shadow-lg xl:sticky xl:top-24 xl:col-start-3 xl:row-span-2 xl:row-start-1"
                : "order-3"
            }
          >
            {/* BuyBox: Caixa de compra com preço, frete, cupom, botões */}
            <BuyBox
              productId={product.id}
              varianteIdSelecionada={selectedVariant?.id}
              // Preços da modalidade ATIVA (formatados pelo hook)
              precoPix={
                precoVarianteSelecionada?.pix.valor || precoPixFormatado
              }
              precoNormal={
                precoVarianteSelecionada?.cartao.valor || precoNormalFormatado
              }
              precoParc={
                parcelamentosVariante[0]
                  ? `${parcelamentosVariante[0].parcelas}x de ${parcelamentosVariante[0].valor}`
                  : precoParceladoFormatado
              }
              descontoPix={descontoPixVariante}
              promocaoVisual={promocaoVisualCompra}
              prazoEntrega={prazoEntrega}
              // Dados reais de entrega
              disponibilidadeCompra={disponibilidadeCompra}
              precoCalculado={precoCompraCalculado}
              selectedVariantLabel={rotuloVarianteSelecionada}
              retiradaLocal={retiradaLocal}
              allowsOwnDelivery={!!product.allowsOwnDelivery}
              servicosComPagamentoNaEntrega={servicosComPagamentoNaEntrega}
              // Cupom e callbacks
              cupomAplicado={cupomAplicado}
              onAplicarCupom={aplicarCupom}
              onRemoverCupom={removerCupom}
              onAddToCart={adicionarProdutoAoCarrinho}
              onComprarAgora={comprarProdutoAgora}
              onShowPaymentOptions={() => setModalPgto(true)}
              onQuantidadeChange={setQuantidadePrincipal}
              // === SELETOR DE MODALIDADES INTEGRADO (NOVO) ===
              modalidades={modalidadesDisponiveis}
              modalidadeAtiva={modalidadeAtiva}
              onTrocarModalidade={selecionarModalidade}
            />
          </div>

          {modoPreVisualizacao ? (
            <div className="border-surface-border order-4 rounded-3xl border bg-white px-5 pb-6 shadow-sm sm:px-6 xl:col-span-2 xl:col-start-1 xl:row-start-2">
              {abasProduto}
            </div>
          ) : null}
        </div>

        {/* ==========================================
            ABAS: Descrição, Especificações, Avaliações
            ========================================== */}
        {!modoPreVisualizacao ? abasProduto : null}

        {/* COMPRE JUNTO: Produtos relacionados */}
        {!modoPreVisualizacao ? <UpsellSection produtos={[]} /> : null}
        {conteudoComplementar}
      </main>

      {/* FOOTER: Rodapé do site */}
      <Footer />

      {/* MODAL DE PAGAMENTO: Opções de parcelamento */}
      <PaymentModal
        isOpen={modalPgto}
        onClose={() => setModalPgto(false)}
        parcelamentos={
          parcelamentosVariante.length > 0
            ? parcelamentosVariante
            : parcelamentosCartao
        }
        precoCalculado={precoCompraCalculado}
      />
    </div>
  );
}

const tituloModalidadePorTipo: Record<string, string> = {
  stock: "Estoque Próprio",
  pre_sale: "Pré-venda",
  preSale: "Pré-venda",
  dropshipping: "Dropshipping",
  order_basis: "Sob Encomenda",
  orderBasis: "Sob Encomenda",
};

function textoParecePrazo(texto?: string | null) {
  if (!texto) return false;

  return /(\d+\s*(dia|dias|hora|horas)|consulte prazo|entrega|úteis|uteis)/i.test(
    texto,
  );
}

function normalizarTextoComparacao(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isAtributoCor(nomeAtributo: string) {
  const normalizado = normalizarTextoComparacao(nomeAtributo);
  return normalizado === "cor" || normalizado === "color";
}

function obterValorCorVariante(variante: VarianteProdutoLoja | null) {
  if (!variante) return null;

  const entradaCor = Object.entries(variante.attributes || {}).find(([nome]) =>
    isAtributoCor(nome),
  );
  return entradaCor?.[1] ?? null;
}

function resolverImagemVariante({
  varianteSelecionada,
  variantes,
}: {
  varianteSelecionada: VarianteProdutoLoja | null;
  variantes: VarianteProdutoLoja[];
}) {
  if (!varianteSelecionada) return null;

  if (varianteSelecionada.imageUrl?.trim()) {
    return varianteSelecionada.imageUrl;
  }

  const valorCorSelecionado = obterValorCorVariante(varianteSelecionada);
  if (!valorCorSelecionado) return null;

  const corNormalizadaSelecionada =
    normalizarTextoComparacao(valorCorSelecionado);
  const varianteMesmaCorComImagem = variantes.find((variante) => {
    const valorCorAtual = obterValorCorVariante(variante);
    if (!valorCorAtual) return false;

    return (
      normalizarTextoComparacao(valorCorAtual) === corNormalizadaSelecionada &&
      Boolean(variante.imageUrl?.trim())
    );
  });

  return varianteMesmaCorComImagem?.imageUrl ?? null;
}

function converterDataPromocao(data: Date | string | null | undefined) {
  if (!data) return null;
  const dataConvertida = data instanceof Date ? data : new Date(data);
  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

function isOfertaRelampagoAtiva(modalidade: PrecoModalidade) {
  if (!modalidade.hasPromo || !modalidade.promoPrice) return false;
  if (modalidade.promoType !== "flash") return false;

  const dataFinal = converterDataPromocao(modalidade.promoEndDate);
  if (!dataFinal) return false;

  return dataFinal.getTime() > Date.now();
}

function obterPrecoModalidadeVigente(modalidade: PrecoModalidade) {
  if (!modalidade.hasPromo || !modalidade.promoPrice) return modalidade.price;

  if (modalidade.promoType === "flash") {
    return isOfertaRelampagoAtiva(modalidade)
      ? modalidade.promoPrice
      : modalidade.price;
  }

  return modalidade.promoPrice;
}

function mapearEspecificacoesProduto(
  attributes: AtributoProdutoLoja[] | undefined,
): Especificacao[] {
  if (!attributes?.length) return [];

  return attributes
    .filter((attribute) => attribute.name.trim() && attribute.values.length > 0)
    .map((attribute) => ({
      label: attribute.name,
      valor: attribute.values.join(", "),
    }));
}

function mapearMedidasEPesoProduto({
  peso,
  altura,
  largura,
  comprimento,
}: {
  peso: number | null;
  altura: number | null;
  largura: number | null;
  comprimento: number | null;
}): Especificacao[] {
  const linhas: Especificacao[] = [];
  const formatarPesoEmKg = (pesoEmGramas: number) =>
    `${(pesoEmGramas / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} kg`;

  if (typeof peso === "number") {
    linhas.push({ label: "Peso", valor: formatarPesoEmKg(peso) });
  }
  if (typeof altura === "number")
    linhas.push({ label: "Altura", valor: `${altura} cm` });
  if (typeof largura === "number")
    linhas.push({ label: "Largura", valor: `${largura} cm` });
  if (typeof comprimento === "number")
    linhas.push({ label: "Comprimento", valor: `${comprimento} cm` });

  return linhas;
}

function calcularRating(avaliacoes: Avaliacao[]) {
  if (avaliacoes.length === 0) return 0;
  const soma = avaliacoes.reduce((acc, item) => acc + item.estrelas, 0);
  return Number((soma / avaliacoes.length).toFixed(1));
}
