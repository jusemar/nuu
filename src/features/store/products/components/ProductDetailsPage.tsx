// ==========================================
// ORQUESTRADOR: ProductDetailsPage (COM DADOS REAIS)
// ==========================================
// Responsabilidade: Juntar todos os componentes da página de produto
// Agora com dados reais de preços vindos do banco

"use client";

import { useState } from "react";
import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { BuyBox } from "./buy-box";
import { PaymentModal } from "./payment-modal";
import { ProductTabs } from "./product-tabs";
import { UpsellSection } from "./upsell-section";
import { Header } from "@/features/header";
import { Footer } from "@/components/common/footer";
import { useProductPricing } from "../hooks/useProductPricing";

// MOCKS temporários (apenas para dados que ainda não estão no banco)
import {
  produto,
  transportadoras,
  parcelamentos,
  cuponsValidos,
} from "../constants/mockData";

import type { PrecoModalidade, ModalidadeInfo } from "../types/product.types";

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
    galleryImages?: Array<{
      id: string;
      imageUrl: string;
      altText: string | null;
      isPrimary: boolean | null;
      sortOrder: number | string;
    }>;
    pricing?: PrecoModalidade[];
  };
}

// ==========================================
// FUNÇÃO UTILITÁRIA: Formatar centavos → R$
// ==========================================
function formatarPreco(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==========================================
// FUNÇÃO: Converter dados reais para o formato do ProductInfo
// ==========================================
// Motivo: O ProductInfo espera um formato específico com ícones, cores, etc.
// Os dados reais do banco (PrecoModalidade) são convertidos para ModalidadeInfo
function formatarModalidadesParaProductInfo(
  precos: PrecoModalidade[]
): Record<string, ModalidadeInfo> {
  // Configurações visuais por tipo de modalidade
  const configPorTipo: Record<string, { icon: string; badge: string; badgeBg: string; badgeColor: string }> = {
    stock: {
      icon: "🏭",
      badge: "Estoque Próprio",
      badgeBg: "#E8F5E9",
      badgeColor: "#2E7D32",
    },
    pre_sale: {
      icon: "⏳",
      badge: "Pré-venda",
      badgeBg: "#FFF3E0",
      badgeColor: "#ED6C02",
    },
    dropshipping: {
      icon: "📦",
      badge: "Dropshipping",
      badgeBg: "#E3F2FD",
      badgeColor: "#0288D1",
    },
    order_basis: {
      icon: "📋",
      badge: "Sob Encomenda",
      badgeBg: "#F3E5F5",
      badgeColor: "#7B1FA2",
    },
  };

  const resultado: Record<string, ModalidadeInfo> = {};

  // Percorre cada preço real do banco e converte
  precos.forEach((preco) => {
    // Pega a configuração visual baseada no tipo (stock, pre_sale, etc)
    const config = configPorTipo[preco.type] || configPorTipo.stock;

    // Preço atual: usa promoção se estiver ativa
    const precoAtual = preco.hasPromo && preco.promoPrice
      ? preco.promoPrice
      : preco.price;

    // Preço do cartão (simula acréscimo de 15% - futuro virá do banco)
    const precoCartao = Math.round(precoAtual * 1.15);

    // Monta o objeto no formato que o ProductInfo espera
    resultado[preco.type] = {
      icon: config.icon,
      label: preco.pricingModalDescription || preco.type,
      badge: config.badge,
      badgeBg: config.badgeBg,
      badgeColor: config.badgeColor,
      precoPix: formatarPreco(precoAtual),
      precoNormal: formatarPreco(precoCartao),
      prazo: preco.deliveryDays || "Consulte prazo",
      garantia: "12 meses", // Mock - futuro virá do banco
      envia: "Brasil", // Mock - futuro virá do banco
    };
  });

  return resultado;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductDetail({ product }: ProductDetailProps) {
  // -----------------------------------------
  // ESTADOS GLOBAIS
  // -----------------------------------------
  const [modalPgto, setModalPgto] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cupomAplicado, setCupomAplicado] = useState<null | {
    desconto: number;
    label: string;
    code: string;
  }>(null);

  // -----------------------------------------
  // HOOK: Preços e modalidades (para o BuyBox)
  // -----------------------------------------
  const {
    modalidadeAtiva,
    modalidadesDisponiveis,
    selecionarModalidade,
    precoPixFormatado,
    precoNormalFormatado,
    precoParceladoFormatado,
    descontoPix,
    prazoEntrega,
  } = useProductPricing(product.pricing || []);

  // -----------------------------------------
  // CONVERTER dados reais para o formato do ProductInfo
  // -----------------------------------------
  const modalidadesReaisFormatadas = formatarModalidadesParaProductInfo(
    product.pricing || []
  );

  // -----------------------------------------
  // IMAGENS (formato que funciona)
  // -----------------------------------------
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

  const galleryImages =
    productImages.length > 0 ? productImages : produto.imagens;

  // -----------------------------------------
  // DESCRIÇÕES
  // -----------------------------------------
  const productShortDescription =
    product.cardShortText?.trim() || product.description;
  const productLongDescription = product.description;

  // -----------------------------------------
  // HANDLERS
  // -----------------------------------------
  function aplicarCupom(codigo: string) {
    if (cuponsValidos[codigo]) {
      setCupomAplicado({ ...cuponsValidos[codigo], code: codigo });
    }
  }

  function removerCupom() {
    setCupomAplicado(null);
  }

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="bg-surface-bg text-text-primary min-h-screen font-sans">
      <Header />

      {/* BREADCRUMB */}
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="text-text-hint flex gap-1.5 text-xs">
          <span>
            Home / Tênis / Corrida /
            <span className="text-primary ml-1 font-semibold">
              {product.name}
            </span>
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:grid-cols-[420px_1fr_320px]">
          {/* COLUNA 1: GALERIA */}
          <div className="order-1">
            <ProductGallery imagens={galleryImages} isLancamento={true} />
          </div>

          {/* COLUNA 2: INFO (AGORA COM DADOS REAIS DE PREÇOS) */}
          <div className="order-2">
            <ProductInfo
              nome={product.name}
              marca={product.brand || produto.marca}
              sku={product.sku}
              rating={produto.rating}
              totalAvaliacoes={produto.totalAvaliacoes}
              vendedor={produto.vendedor}
              vendedorRating={produto.vendedorRating}
              descricao={productShortDescription}
              cores={produto.cores}
              tamanhos={produto.tamanhos}
              modalidades={modalidadesReaisFormatadas} // ← DADOS REAIS CONVERTIDOS
            />
          </div>

          {/* COLUNA 3: SELETOR + BUY BOX */}
          <div className="order-3 hidden xl:block">
            {/* SELETOR DE MODALIDADES (básico - para teste) */}
            {modalidadesDisponiveis.length > 0 && (
              <div className="border-surface-border mb-4 rounded-2xl border bg-white p-4">
                <div className="text-text-primary mb-3 text-xs font-semibold">
                  Escolha a modalidade:
                </div>

                <div className="flex flex-col gap-2">
                  {modalidadesDisponiveis.map((mod) => (
                    <button
                      key={mod.type}
                      onClick={() => selecionarModalidade(mod.type)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        modalidadeAtiva.type === mod.type
                          ? "border-primary bg-primary-light"
                          : "border-surface-border hover:border-primary-mid"
                      } `}
                    >
                      <div>
                        <div className="text-text-primary text-xs font-bold">
                          {mod.pricingModalDescription || mod.type}
                        </div>
                        <div className="text-text-muted text-[10px]">
                          Prazo: {mod.deliveryDays || "Consulte prazo"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-text-primary text-sm font-extrabold">
                          {mod.hasPromo && mod.promoPrice
                            ? formatarPreco(mod.promoPrice)
                            : formatarPreco(mod.price)}
                        </div>
                        {mod.hasPromo && mod.promoPrice && (
                          <div className="text-text-hint text-[10px] line-through">
                            {formatarPreco(mod.price)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-surface-border mt-3 border-t pt-3">
                  <div className="text-text-muted text-[11px]">
                    Selecionado:
                    <span className="text-primary ml-1 font-semibold">
                      {modalidadeAtiva.pricingModalDescription ||
                        modalidadeAtiva.type}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* BUY BOX */}
            <BuyBox
              precoPix={precoPixFormatado}
              precoNormal={precoNormalFormatado}
              precoParc={precoParceladoFormatado}
              descontoPix={descontoPix}
              prazoEntrega={prazoEntrega}
              estoque={produto.estoque}
              transportadoras={transportadoras}
              cupomAplicado={cupomAplicado}
              onAplicarCupom={aplicarCupom}
              onRemoverCupom={removerCupom}
              onAddToCart={(qty) => setCartCount((c) => c + qty)}
              onShowPaymentOptions={() => setModalPgto(true)}
              modalidades={modalidadesDisponiveis}
              modalidadeAtiva={modalidadeAtiva}
              onTrocarModalidade={selecionarModalidade}
            />
          </div>
        </div>

        {/* ABAS */}
        <ProductTabs
          descricao={productLongDescription}
          especificacoes={produto.especificacoes}
          avaliacoes={produto.avaliacoes}
          rating={produto.rating}
          totalAvaliacoes={produto.totalAvaliacoes}
          modalidades={modalidadesReaisFormatadas} // ← TAMBÉM ATUALIZADO
        />

        <UpsellSection produtos={produto.upsell} />
      </main>

      <Footer />

      <PaymentModal
        isOpen={modalPgto}
        onClose={() => setModalPgto(false)}
        precoPix={precoPixFormatado}
        descontoPix={descontoPix}
        parcelamentos={parcelamentos}
        precoFinalPix={
          cupomAplicado
            ? (
                parseFloat(
                  precoPixFormatado.replace("R$ ", "").replace(",", ".")
                ) *
                (1 - cupomAplicado.desconto / 100)
              )
                .toFixed(2)
                .replace(".", ",")
            : undefined
        }
      />
    </div>
  );
}