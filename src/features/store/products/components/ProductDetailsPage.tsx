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

import type { PrecoModalidade, Modalidade } from "../types/product.types";

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
    allowsPickup: boolean | null;
    prazoRetiradaCustom: string | null;
    galleryImages?: Array<{
      id: string;
      imageUrl: string;
      altText: string | null;
      isPrimary: boolean | null;
      sortOrder: number | string;
    }>;
    pricing?: PrecoModalidade[];
    modeloRetirada?: {
      id: string;
      nome: string;
      prazoTexto: string;
      mensagem: string | null;
      ativo: boolean;
    } | null;
  };
}

// ==========================================
// FUNÇÃO UTILITÁRIA: Formatar centavos → R$
// ==========================================
// Recebe: número em centavos (ex: 5151)
// Retorna: string formatada (ex: "R$ 51,51")
function formatarPreco(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductDetail({ product }: ProductDetailProps) {
  
  // -----------------------------------------
  // ESTADOS GLOBAIS DA PÁGINA
  // -----------------------------------------
  // modalPgto: controla se o modal de pagamento está aberto
  const [modalPgto, setModalPgto] = useState(false);
  
  // cartCount: quantidade de itens no carrinho (simulação)
  const [cartCount, setCartCount] = useState(0);
  
  // cupomAplicado: cupom de desconto ativo (ainda mock)
  const [cupomAplicado, setCupomAplicado] = useState<null | {
    desconto: number;
    label: string;
    code: string;
  }>(null);

  // -----------------------------------------
  // HOOK: Gerenciamento de preços e modalidades (ESTADO GLOBAL)
  // -----------------------------------------
  // Este hook é a FONTE ÚNICA DA VERDADE para preços
  // Ele mantém qual modalidade está ativa e calcula os preços formatados
  const {
    modalidadeAtiva,           // Objeto da modalidade selecionada (ex: stock)
    modalidadesDisponiveis,    // Array com todas as modalidades ativas do DB
    selecionarModalidade,      // Função para trocar de modalidade
    precoPixFormatado,         // "R$ 51,51" (preço atual formatado)
    precoNormalFormatado,      // "R$ 59,24" (preço no cartão)
    precoParceladoFormatado,   // "3x de R$ 17,17" (parcelamento)
    descontoPix,               // 13 (% de desconto PIX)
    prazoEntrega,              // "imediato" (prazo da modalidade ativa)
  } = useProductPricing(product.pricing || []);

  // -----------------------------------------
  // RETIRADA LOCAL: Dados reais do banco
  // -----------------------------------------
  // Só mostra se o produto tem retirada habilitada E tem modelo selecionado
  const retiradaLocal = product.allowsPickup && product.modeloRetirada
    ? {
        nome: product.modeloRetirada.nome,
        prazo: product.prazoRetiradaCustom || product.modeloRetirada.prazoTexto,
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

  // Fallback: se não tiver imagens no DB, usa mock temporário
  const galleryImages =
    productImages.length > 0 ? productImages : produto.imagens;

  // -----------------------------------------
  // DESCRIÇÕES: Curta e longa
  // -----------------------------------------
  // Descrição curta: usa cardShortText se existir, senão description
  const productShortDescription =
    product.cardShortText?.trim() || product.description;
  
  // Descrição longa: sempre a description completa (para abas)
  const productLongDescription = product.description;

  // -----------------------------------------
  // HANDLERS: Ações do usuário
  // -----------------------------------------
  
  // Aplica cupom de desconto (ainda mock - futuro: validar no backend)
  function aplicarCupom(codigo: string) {
    if (cuponsValidos[codigo]) {
      setCupomAplicado({ ...cuponsValidos[codigo], code: codigo });
    }
  }

  // Remove cupom aplicado
  function removerCupom() {
    setCupomAplicado(null);
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
            Home / Tênis / Corrida /
            <span className="text-primary ml-1 font-semibold">
              {product.name}
            </span>
          </span>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: Grid de 3 colunas */}
      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:grid-cols-[420px_1fr_320px]">
          
          {/* ==========================================
              COLUNA 1: GALERIA DE IMAGENS
              Recebe: array de URLs (strings)
              ========================================== */}
          <div className="order-1">
            <ProductGallery 
              imagens={galleryImages} 
              isLancamento={true} 
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
              marca={product.brand || produto.marca}
              sku={product.sku}
              rating={produto.rating}
              totalAvaliacoes={produto.totalAvaliacoes}
              vendedor={produto.vendedor}
              vendedorRating={produto.vendedorRating}
              descricao={productShortDescription}
              cores={produto.cores}
              tamanhos={produto.tamanhos}
              
              // === ESTADO GLOBAL DE MODALIDADES (NOVO) ===
              // Antes: ProductInfo gerenciava sozinho (estado local)
              // Agora: Recebe do pai e comunica mudanças via callback
              modalidadesDisponiveis={modalidadesDisponiveis}  // Array de modalidades
              modalidadeAtiva={modalidadeAtiva}                // Qual está selecionada
              onTrocarModalidade={selecionarModalidade}       // Função para trocar
            />
          </div>

          {/* ==========================================
              COLUNA 3: BUY BOX (CAIXA DE COMPRA)
              Recebe: Mesmo estado global da coluna 2
              Resultado: Quando clica no ProductInfo, BuyBox atualiza automaticamente
              ========================================== */}
          <div className="order-3 hidden xl:block">
            
            {/* BuyBox: Caixa de compra com preço, frete, cupom, botões */}
            <BuyBox
              // Preços da modalidade ATIVA (formatados pelo hook)
              precoPix={precoPixFormatado}
              precoNormal={precoNormalFormatado}
              precoParc={precoParceladoFormatado}
              descontoPix={descontoPix}
              prazoEntrega={prazoEntrega}
              
              // Dados mock (ainda não no banco)
              estoque={produto.estoque}
              transportadoras={transportadoras}
              
              // Dados reais de retirada local (do admin)
              retiradaLocal={retiradaLocal}
              
              // Cupom e callbacks
              cupomAplicado={cupomAplicado}
              onAplicarCupom={aplicarCupom}
              onRemoverCupom={removerCupom}
              onAddToCart={(qty) => setCartCount((c) => c + qty)}
              onShowPaymentOptions={() => setModalPgto(true)}
              
              // === SELETOR DE MODALIDADES INTEGRADO (NOVO) ===
              // Permite trocar modalidade diretamente no BuyBox também
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
          especificacoes={produto.especificacoes}
          avaliacoes={produto.avaliacoes}
          rating={produto.rating}
          totalAvaliacoes={produto.totalAvaliacoes}
          // Passa modalidades reais para a aba de preços (se existir)
          modalidades={modalidadesDisponiveis.reduce((acc, mod) => {
            acc[mod.type] = {
              icon: mod.type === 'stock' ? '🏭' : mod.type === 'pre_sale' ? '⏳' : mod.type === 'dropshipping' ? '📦' : '📋',
              label: mod.pricingModalDescription || mod.type,
              badge: mod.type === 'stock' ? 'Estoque Próprio' : mod.type === 'pre_sale' ? 'Pré-venda' : mod.type === 'dropshipping' ? 'Dropshipping' : 'Sob Encomenda',
              badgeBg: mod.type === 'stock' ? '#E8F5E9' : mod.type === 'pre_sale' ? '#FFF3E0' : mod.type === 'dropshipping' ? '#E3F2FD' : '#F3E5F5',
              badgeColor: mod.type === 'stock' ? '#2E7D32' : mod.type === 'pre_sale' ? '#ED6C02' : mod.type === 'dropshipping' ? '#0288D1' : '#7B1FA2',
              precoPix: formatarPreco(mod.hasPromo && mod.promoPrice ? mod.promoPrice : mod.price),
              precoNormal: formatarPreco(Math.round((mod.hasPromo && mod.promoPrice ? mod.promoPrice : mod.price) * 1.15)),
              prazo: mod.deliveryDays || 'Consulte prazo',
              garantia: '12 meses',
              envia: 'Brasil',
            };
            return acc;
          }, {} as Record<string, any>)}
        />

        {/* COMPRE JUNTO: Produtos relacionados */}
        <UpsellSection produtos={produto.upsell} />
      </main>

      {/* FOOTER: Rodapé do site */}
      <Footer />

      {/* MODAL DE PAGAMENTO: Opções de parcelamento */}
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