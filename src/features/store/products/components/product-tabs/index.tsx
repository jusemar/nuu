// ==========================================
// COMPONENTE: ProductTabs
// ==========================================
// Responsabilidade: Mostrar abas de navegação (Descrição, Especificações, Avaliações, Entrega)

'use client';

import { useState } from 'react';
import { Stars } from '@/components/ui/stars'; // 🆕 IMPORT DO COMPONENTE GLOBAL
import type { Avaliacao, Especificacao, ModalidadeInfo } from '../../types/product.types';

interface ProductTabsProps {
  descricao: string;
  especificacoes: Especificacao[];
  avaliacoes: Avaliacao[];
  rating: number;
  totalAvaliacoes: number;
  modalidades: Record<string, ModalidadeInfo>;
}

export function ProductTabs({
  descricao,
  especificacoes,
  avaliacoes,
  rating,
  totalAvaliacoes,
  modalidades,
}: ProductTabsProps) {
  
  const [abaAtiva, setAbaAtiva] = useState<'descricao' | 'especificacoes' | 'avaliacoes' | 'entrega'>('descricao');

  return (
    <div className="mt-16">
      
      {/* Menu de abas */}
      <div className="flex gap-7 border-b border-surface-border mb-7 overflow-x-auto">
        {[
          { id: 'descricao', label: 'Descrição' },
          { id: 'especificacoes', label: 'Especificações' },
          { id: 'avaliacoes', label: 'Avaliações' },
          { id: 'entrega', label: 'Entrega' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id as any)}
            className={`pb-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${abaAtiva === tab.id ? 'text-primary border-primary' : 'text-text-hint border-transparent hover:text-text-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      <div className="max-w-2xl">
        
        {/* ABA: DESCRIÇÃO */}
        {abaAtiva === 'descricao' && (
          <div className="flex flex-col gap-3 animate-[fadeUp_0.3s_ease]">
            <p className="text-sm text-text-muted leading-relaxed">{descricao}</p>
          </div>
        )}

        {/* ABA: ESPECIFICAÇÕES */}
        {abaAtiva === 'especificacoes' && (
          <div className="max-w-lg border border-surface-border rounded-xl overflow-hidden bg-white animate-[fadeUp_0.3s_ease]">
            {especificacoes.map((esp, i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-3 ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} ${i !== especificacoes.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                <span className="text-sm text-text-muted">{esp.label}</span>
                <span className="text-sm font-semibold text-text-primary">{esp.valor}</span>
              </div>
            ))}
          </div>
        )}

        {/* ABA: AVALIAÇÕES */}
        {abaAtiva === 'avaliacoes' && (
          <div className="flex flex-col gap-3.5 max-w-2xl animate-[fadeUp_0.3s_ease]">
            {/* Resumo das avaliações */}
            <div className="bg-white border border-surface-border rounded-xl p-5 flex gap-7 items-center flex-wrap">
              <div className="text-center flex-shrink-0">
                <div className="text-5xl font-extrabold leading-none text-text-primary">{rating}</div>
                <Stars rating={rating} size="lg" /> {/* 🆕 USA O COMPONENTE IMPORTADO */}
                <div className="text-xs text-text-hint mt-1">{totalAvaliacoes.toLocaleString('pt-BR')} avaliações</div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 min-w-[200px]">
                {[5, 4, 3, 2, 1].map((estrela) => (
                  <div key={estrela} className="flex items-center gap-2 text-xs">
                    <span className="text-text-muted w-4">{estrela}</span>
                    <span className="text-accent">★</span>
                    <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${estrela === 5 ? 82 : estrela === 4 ? 11 : estrela === 3 ? 4 : estrela === 2 ? 2 : 1}%` }} />
                    </div>
                    <span className="text-text-hint min-w-[30px] text-right">{estrela === 5 ? '82%' : estrela === 4 ? '11%' : estrela === 3 ? '4%' : estrela === 2 ? '2%' : '1%'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de avaliações */}
            {avaliacoes.map((av, i) => (
              <div key={i} className="bg-white border border-[#F3F4F6] rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0" style={{ background: av.cor }}>
                    {av.iniciais}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-text-primary">{av.nome}</div>
                    <div className="text-xs text-text-hint">{av.data}</div>
                  </div>
                  <Stars rating={av.estrelas} /> {/* 🆕 USA O COMPONENTE IMPORTADO */}
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{av.comentario}</p>
              </div>
            ))}
          </div>
        )}

        {/* ABA: ENTREGA */}
        {abaAtiva === 'entrega' && (
          <div className="flex flex-col gap-2 max-w-lg animate-[fadeUp_0.3s_ease]">
            {Object.entries(modalidades).map(([key, mod]) => (
              <div key={key} className="bg-white border border-surface-border rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">{mod.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-text-primary">{mod.label}</div>
                  <div className="text-xs text-text-hint mt-0.5">Enviado por: {mod.envia}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-text-primary">{mod.prazo}</div>
                  <div className="text-xs text-text-hint">Garantia: {mod.garantia}</div>
                </div>
              </div>
            ))}
            <div className="bg-[#F9FAFB] border border-surface-border rounded-xl p-3 text-xs text-text-muted leading-relaxed">
              <strong className="text-text-primary">Política:</strong> Prazos a partir da confirmação do pagamento. Frete grátis acima de R$ 299 no estoque próprio.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}