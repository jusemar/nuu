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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { BuyBox } from "./buy-box";
import { PaymentModal } from "./payment-modal";
import { ProductTabs } from "./product-tabs";
import { UpsellSection } from "./upsell-section";
import { Header } from "@/features/header";
import { Footer } from "@/components/common/footer";
import { useProductPricing } from "../hooks/useProductPricing";
import { useCarrinho } from "@/features/carrinho";
import type { NovoItemCarrinho } from "@/features/carrinho";
import type { PrecosProdutoPorModalidade } from "@/features/precificacao";
import { stripProductRichText } from "../utils/rich-text";

import type {
  AtributoProdutoLoja,
  Avaliacao,
  Especificacao,
  Modalidade,
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../types/product.types";

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
  breadcrumbCategorias: string[];
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
  precosCalculadosPorVariante: PrecosProdutoPorModalidade;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductDetail({
  product,
  breadcrumbCategorias,
  precosCalculadosPorModalidade,
  precosCalculadosPorVariante,
}: ProductDetailProps) {
  const caminhoCategorias =
    breadcrumbCategorias.length > 0
      ? `${breadcrumbCategorias.join(" / ")} / `
      : "";

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
  const [selectedVariant, setSelectedVariant] =
    useState<VarianteProdutoLoja | null>(() => {
      if (product.productKind !== "variable") return null;

      return (
        publicVariants.find((variant) => variant.isDefault) ||
        publicVariants.find((variant) => variant.stockQuantity > 0) ||
        publicVariants[0] ||
        null
      );
    });
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
      : promocaoNormalAtivaModalidadeAtiva
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
    imagemVarianteResolvida && !galleryImagesBase.includes(imagemVarianteResolvida)
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
      produtoVarianteId: selectedVariant?.id,
      produtoSlug: product.slug,
      produtoUrl: `/product/${product.slug}`,
      nome: product.name,
      sku: selectedVariant?.sku || product.sku,
      modalidadeTipo: selectedVariant
        ? `variant:${selectedVariant.id}`
        : modalidadeAtiva.type,
      modalidadeTitulo: selectedVariant
        ? descricaoVariante
        : tituloModalidadePorTipo[modalidadeAtiva.type] ||
          (!textoParecePrazo(modalidadeAtiva.pricingModalDescription)
            ? modalidadeAtiva.pricingModalDescription
            : null) ||
          modalidadeAtiva.type,
      variante: descricaoVariante,
      atributosVariante: selectedVariant?.attributes,
      prazoModalidade: selectedVariant
        ? "Consulte prazo"
        : modalidadeAtiva.deliveryDays || "Consulte prazo",
      imagemUrl: galleryImages[0] || "/produto-sem-foto.webp",
      precoEmCentavos,
      estoqueDisponivel: selectedVariant?.stockQuantity,
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
  return (
    <div className="bg-surface-bg text-text-primary min-h-screen font-sans">
      {/* HEADER: Navegação principal do site */}
      <Header />

      {/* BREADCRUMB: Indica onde o usuário está (Home > Categoria > Produto) */}
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="text-text-hint flex gap-1.5 text-xs">
          <span>
            Home / {caminhoCategorias}
            <span className="text-primary ml-1 font-semibold">
              {product.name}
            </span>
          </span>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: Grid de 3 colunas */}
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-6 sm:px-6 md:grid-cols-[minmax(300px,45%)_1fr] xl:grid-cols-[minmax(300px,420px)_minmax(400px,2fr)_minmax(280px,320px)]">
          {/* ==========================================
              COLUNA 1: GALERIA DE IMAGENS
              Recebe: array de URLs (strings)
              ========================================== */}
          <div className="order-1 xl:max-w-[420px]">
            <ProductGallery
              imagens={galleryImages}
              isLancamento={true}
              tipoBadge={tipoBadgeGaleria}
              dataFimRelampago={dataFimPromocaoModalidadeAtiva}
            />
          </div>

          {/* ==========================================
              COLUNA 2: INFORMAÇÕES DO PRODUTO
              NOVO: Recebe estado GLOBAL de modalidades do hook
              Antes: ProductInfo tinha estado interno (não comunicava com BuyBox)
              Agora: Compartilha o mesmo estado do BuyBox via props
              ========================================== */}
          <div className="order-2">
            <ProductInfo
              // Dados básicos do produto
              nome={product.name}
              marca={product.brand || ""}
              sku={product.sku}
              rating={ratingProduto}
              totalAvaliacoes={totalAvaliacoesProduto}
              vendedor={product.brand ? `Loja ${product.brand}` : undefined}
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
            />
          </div>

          {/* ==========================================
              COLUNA 3: BUY BOX (CAIXA DE COMPRA)
              Recebe: Mesmo estado global da coluna 2
              Resultado: Quando clica no ProductInfo, BuyBox atualiza automaticamente
              ========================================== */}
          <div className="order-3">
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
              prazoEntrega={prazoEntrega}
              // Dados reais de entrega
              estoque={
                selectedVariant?.stockQuantity ??
                (product.productKind === "variable" ? 0 : 0)
              }
              selectedVariantLabel={
                selectedVariant
                  ? selectedVariant.name ||
                    Object.values(selectedVariant.attributes).join(" / ")
                  : null
              }
              retiradaLocal={retiradaLocal}
              allowsOwnDelivery={!!product.allowsOwnDelivery}
              // Cupom e callbacks
              cupomAplicado={cupomAplicado}
              onAplicarCupom={aplicarCupom}
              onRemoverCupom={removerCupom}
              onAddToCart={adicionarProdutoAoCarrinho}
              onComprarAgora={comprarProdutoAgora}
              onShowPaymentOptions={() => setModalPgto(true)}
              // === SELETOR DE MODALIDADES INTEGRADO (NOVO) ===
              modalidades={modalidadesDisponiveis}
              modalidadeAtiva={modalidadeAtiva}
              onTrocarModalidade={selecionarModalidade}
            />
          </div>
        </div>

        {/* ==========================================
            ABAS: Descrição, Especificações, Avaliações
            ========================================== */}
        <ProductTabs
          descricao={productLongDescription}
          especificacoes={especificacoesProduto}
          medidasEPeso={medidasEPeso}
          avaliacoes={avaliacoesProduto}
          rating={ratingProduto}
          totalAvaliacoes={totalAvaliacoesProduto}
          // Passa modalidades reais para a aba de preços (se existir)
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
                badge:
                  mod.type === "stock"
                    ? "Estoque Próprio"
                    : mod.type === "pre_sale"
                      ? "Pré-venda"
                      : mod.type === "dropshipping"
                        ? "Dropshipping"
                        : "Sob Encomenda",
                badgeBg:
                  mod.type === "stock"
                    ? "#E8F5E9"
                    : mod.type === "pre_sale"
                      ? "#FFF3E0"
                      : mod.type === "dropshipping"
                        ? "#E3F2FD"
                        : "#F3E5F5",
                badgeColor:
                  mod.type === "stock"
                    ? "#2E7D32"
                    : mod.type === "pre_sale"
                      ? "#ED6C02"
                      : mod.type === "dropshipping"
                        ? "#0288D1"
                        : "#7B1FA2",
                precoPix:
                  precosCalculadosPorModalidade[mod.type]?.pix.valor || "",
                precoNormal:
                  precosCalculadosPorModalidade[mod.type]?.cartao.valor || "",
                prazo: mod.deliveryDays || "Consulte prazo",
                garantia: "12 meses",
                envia: "Brasil",
              };
              return acc;
            },
            {} as Record<string, any>,
          )}
        />

        {/* COMPRE JUNTO: Produtos relacionados */}
        <UpsellSection produtos={[]} />
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

  const corNormalizadaSelecionada = normalizarTextoComparacao(valorCorSelecionado);
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
