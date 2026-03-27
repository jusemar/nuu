// ==========================================
// ORQUESTRADOR: ProductDetailsPage
// ==========================================
// Responsabilidade: Juntar todos os componentes da página de produto
// O que faz: Importa e organiza os componentes na ordem correta
// Não tem lógica visual - só composição de componentes

'use client';

import { useState } from 'react';
import { Stars } from '@/components/ui/stars';
import { ProductGallery } from './product-gallery';
import { ProductInfo } from './product-info';
import { BuyBox } from './buy-box';
import { PaymentModal } from './payment-modal';
import { ProductTabs } from './product-tabs';
import { UpsellSection } from './upsell-section';
import { produto, modalidades, transportadoras, parcelamentos, cuponsValidos, FRETE_GRATIS_MIN } from '../constants/mockData';
import type { Modalidade } from '../types/product.types';
import { Header } from '@/features/header';
import { Footer } from '@/components/common/footer';

export function ProductDetail() {
  // Estados globais da página
  const [modalPgto, setModalPgto] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cupomAplicado, setCupomAplicado] = useState<null | { desconto: number; label: string; code: string }>(null);

  // Dados da modalidade atual
  const modalidadeSel: Modalidade = 'estoque';
  const mod = modalidades[modalidadeSel];
  
  // Cálculos de preço
  const precoPixBase = parseFloat(mod.precoPix.replace('R$ ', '').replace(',', '.'));
  const descontoPix = Math.round((1 - precoPixBase / parseFloat(mod.precoNormal.replace('R$ ', '').replace(',', '.'))) * 100);
  const precoFinalPix = cupomAplicado ? precoPixBase * (1 - cupomAplicado.desconto / 100) : precoPixBase;

  // Handlers
  const aplicarCupom = (codigo: string) => {
    if (cuponsValidos[codigo]) {
      setCupomAplicado({ ...cuponsValidos[codigo], code: codigo });
    }
  };

  const removerCupom = () => setCupomAplicado(null);

  return (
    <div className="min-h-screen bg-surface-bg font-sans text-text-primary">
      
      {/* HEADER E BREADCRUMB (você vai substituir pelos seus) */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex gap-1.5 text-xs text-text-hint">
          <span>Home / Tênis / Corrida / <span className="text-primary font-semibold">{produto.nome}</span></span>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL - GRID DE 3 COLUNAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        
        {/* GRID RESPONSIVO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[420px_1fr_320px] gap-6 items-start">
          
          {/* COLUNA 1: GALERIA */}
          <div className="order-1">
            <ProductGallery imagens={produto.imagens} isLancamento={true} />
          </div>

          {/* COLUNA 2: INFO DO PRODUTO */}
          <div className="order-2">
            <ProductInfo
              nome={produto.nome}
              marca={produto.marca}
              sku={produto.sku}
              rating={produto.rating}
              totalAvaliacoes={produto.totalAvaliacoes}
              vendedor={produto.vendedor}
              vendedorRating={produto.vendedorRating}
              descricao={produto.descricao}
              cores={produto.cores}
              tamanhos={produto.tamanhos}
              modalidades={modalidades}
            />
          </div>

          {/* COLUNA 3: BUY BOX (sticky) */}
          <div className="order-3 hidden xl:block">
            <BuyBox
              precoPix={mod.precoPix}
              precoNormal={mod.precoNormal}
              precoParc={mod.precoParc}
              descontoPix={descontoPix}
              estoque={produto.estoque}
              transportadoras={transportadoras}
              cupomAplicado={cupomAplicado}
              onAplicarCupom={aplicarCupom}
              onRemoverCupom={removerCupom}
              onAddToCart={(qty) => setCartCount(c => c + qty)}
              onShowPaymentOptions={() => setModalPgto(true)}
            />
          </div>
        </div>

        {/* ABAS (Descrição, Especificações, Avaliações, Entrega) */}
        <ProductTabs
          descricao={produto.descricao}
          especificacoes={produto.especificacoes}
          avaliacoes={produto.avaliacoes}
          rating={produto.rating}
          totalAvaliacoes={produto.totalAvaliacoes}
          modalidades={modalidades}
        />

        {/* COMPRE JUNTO */}
        <UpsellSection produtos={produto.upsell} />

      </main>

      <Footer />

      {/* MODAL DE PAGAMENTO */}
      <PaymentModal
        isOpen={modalPgto}
        onClose={() => setModalPgto(false)}
        precoPix={mod.precoPix}
        descontoPix={descontoPix}
        parcelamentos={parcelamentos}
        precoFinalPix={cupomAplicado ? precoFinalPix : undefined}
      />
    </div>
  );
}