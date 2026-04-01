// ==========================================
// COMPONENTE: PricingModalities
// ==========================================
// Responsabilidade: Seletor de modalidades de preço (designer completo)
// O que faz:
//   - Exibe todas as modalidades disponíveis (estoque, pré-venda, etc)
//   - Permite ao usuário selecionar uma modalidade
//   - Comunica a seleção para o componente pai via callback
//
// Por que existe: Separar a UI de seleção de modalidades do ProductInfo
// (Single Responsibility: este componente só faz a seleção visual)

'use client';

import { useState, useRef } from 'react';
import type { PrecoModalidade, Modalidade } from '../../types/product.types';

// ==========================================
// INTERFACE DAS PROPS
// ==========================================
interface PricingModalitiesProps {
  // Lista de modalidades disponíveis (vindas do banco)
  modalidades: PrecoModalidade[];
  
  // Modalidade atualmente selecionada
  modalidadeAtiva: PrecoModalidade;
  
  // Função para trocar a modalidade (vem do hook)
  onSelecionarModalidade: (tipo: Modalidade) => void;
}

// ==========================================
// FUNÇÃO UTILITÁRIA: Formatar centavos → R$
// ==========================================
function formatarPreco(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// ==========================================
// CONFIGURAÇÕES VISUAIS POR TIPO DE MODALIDADE
// ==========================================
// Ícones e cores para cada modalidade (mantém o designer original)
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

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function PricingModalities({
  modalidades,
  modalidadeAtiva,
  onSelecionarModalidade,
}: PricingModalitiesProps) {
  
  // -----------------------------------------
  // ESTADOS
  // -----------------------------------------
  const [isOpen, setIsOpen] = useState(false); // Controla se o dropdown está aberto
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Timer para hover

  // -----------------------------------------
  // HANDLERS (eventos)
  // -----------------------------------------
  
  // Quando mouse ENTRA (desktop) - abre após 150ms
  function handleMouseEnter() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsOpen(true), 150);
  }

  // Quando mouse SAI (desktop) - fecha após 200ms
  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsOpen(false), 200);
  }

  // Mobile: toque alterna aberto/fechado
  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  // Seleciona uma modalidade e fecha o dropdown
  function handleSelect(tipo: Modalidade) {
    onSelecionarModalidade(tipo);
    setIsOpen(false);
  }

  // -----------------------------------------
  // DADOS DA MODALIDADE ATIVA (para exibir no card principal)
  // -----------------------------------------
  const configAtiva = configPorTipo[modalidadeAtiva.type] || configPorTipo.stock;
  const precoAtual = modalidadeAtiva.hasPromo && modalidadeAtiva.promoPrice
    ? modalidadeAtiva.promoPrice
    : modalidadeAtiva.price;
  const precoCartao = Math.round(precoAtual * 1.15); // Simula 15% a mais no cartão

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div>
      {/* Título */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Modalidade de preço
        </span>
      </div>

      {/* Container com eventos de mouse (hover desktop) */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* CARD DA MODALIDADE SELECIONADA (sempre visível) */}
        <div
          className="border-[1.5px] border-primary rounded-xl p-3 bg-white flex items-center gap-2.5 cursor-pointer transition-all hover:border-primary-mid shadow-[0_0_0_1px_#0C447C]"
          onClick={toggleOpen} // Click no mobile alterna
        >
          {/* Ícone da modalidade */}
          <span className="text-xl">{configAtiva.icon}</span>

          {/* Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[13px]">
                {modalidadeAtiva.pricingModalDescription || modalidadeAtiva.type}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: configAtiva.badgeBg, color: configAtiva.badgeColor }}
              >
                {configAtiva.badge}
              </span>
            </div>
            <div className="text-[11px] text-text-hint mt-0.5">
              🚚 {modalidadeAtiva.deliveryDays || "Consulte prazo"} · 🛡️ 12 meses · por Brasil
            </div>
          </div>

          {/* Preço */}
          <div className="text-right flex-shrink-0">
            <div className="text-[13px] font-bold text-text-primary">
              {formatarPreco(precoAtual)}
            </div>
            <div className="text-[10px] text-success-dark font-semibold">
              no PIX
            </div>
          </div>

          {/* Setinha que gira quando aberto */}
          <div
            className="text-text-hint text-xs ml-1 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </div>
        </div>

        {/* HINT: instrução para o usuário */}
        <div className="hidden md:flex text-[11px] text-text-hint items-center gap-1 mt-1.5 select-none">
          <span>↕</span> Passe o mouse para ver outras modalidades
        </div>
        <div className="flex md:hidden text-[11px] text-text-hint items-center gap-1 mt-1.5 select-none">
          <span>↕</span> Toque para ver outras modalidades de preço
        </div>

        {/* DROPDOWN: Outras modalidades (aparece quando isOpen = true) */}
        {isOpen && (
          <div className="flex flex-col gap-1.5 mt-2 animate-[slideDown_0.2s_ease]">
            {modalidades
              .filter((mod) => mod.type !== modalidadeAtiva.type) // Exclui a selecionada
              .map((mod) => {
                const config = configPorTipo[mod.type] || configPorTipo.stock;
                const precoMod = mod.hasPromo && mod.promoPrice ? mod.promoPrice : mod.price;
                const precoModCartao = Math.round(precoMod * 1.15);

                return (
                  <div
                    key={mod.type}
                    className="border-[1.5px] border-surface-border rounded-xl p-3 bg-white flex items-center gap-2.5 cursor-pointer transition-all hover:border-primary-mid hover:bg-primary-light"
                    onClick={() => handleSelect(mod.type)}
                  >
                    <span className="text-lg">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[13px]">
                          {mod.pricingModalDescription || mod.type}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: config.badgeBg, color: config.badgeColor }}
                        >
                          {config.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-hint mt-0.5">
                        🚚 {mod.deliveryDays || "Consulte prazo"} · 🛡️ 12 meses
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-sm text-text-primary">
                        {formatarPreco(precoMod)}{' '}
                        <span className="text-[10px] text-text-muted font-medium">
                          PIX
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {formatarPreco(precoModCartao)} cartão
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}