// ==========================================
// COMPONENTE: ProductInfo (ATUALIZADO - ESTADO GLOBAL)
// ==========================================
// Responsabilidade: Mostrar informações do produto (coluna do meio)
//
// O QUE MUDOU:
//   - Removido estado interno de modalidade (useState local)
//   - Agora recebe modalidade do pai via props (estado global)
//   - Quando clica em modalidade, chama callback do pai (onTrocarModalidade)
//   - Integrado com PricingModalities (componente filho)
//
// FLUXO:
//   1. Recebe modalidadesDisponiveis, modalidadeAtiva, onTrocarModalidade do pai
//   2. Renderiza PricingModalities com essas props
//   3. Clique no PricingModalities → chama onTrocarModalidade → pai atualiza → BuyBox atualiza

'use client';

import { useState } from 'react';
import type { Cor, Tamanho, PrecoModalidade, Modalidade } from '../../types/product.types';
import { PricingModalities } from '../PricingModalities';
import { ChatVendedor } from '../chat-vendedor';
import { Stars } from '@/components/ui/stars';

// ==========================================
// INTERFACE ATUALIZADA (estado global)
// ==========================================
interface ProductInfoProps {
  // Dados básicos do produto
  nome: string;
  marca: string;
  sku: string;
  rating: number;
  totalAvaliacoes: number;
  vendedor: string;
  vendedorRating: number;
  descricao: string;
  cores: Record<Cor, string>;
  tamanhos: Tamanho[];
  corInicial?: Cor;
  
  // === ESTADO GLOBAL DE MODALIDADES (NOVO) ===
  // Antes: ProductInfo gerenciava sozinho (estado local)
  // Agora: Recebe do ProductDetailsPage (orquestrador)
  modalidadesDisponiveis: PrecoModalidade[];  // Todas as modalidades do DB
  modalidadeAtiva: PrecoModalidade;           // Qual está selecionada agora
  onTrocarModalidade: (tipo: Modalidade) => void; // Callback para trocar
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductInfo({
  nome,
  marca,
  sku,
  rating,
  totalAvaliacoes,
  vendedor,
  vendedorRating,
  descricao,
  cores,
  tamanhos,
  corInicial = 'preto',
  // === NOVAS PROPS (estado global) ===
  modalidadesDisponiveis,
  modalidadeAtiva,
  onTrocarModalidade,
}: ProductInfoProps) {

  // -----------------------------------------
  // ESTADOS LOCAIS (mantidos - não afetam outros componentes)
  // -----------------------------------------
  // Cor selecionada (independente por produto)
  const [corSel, setCorSel] = useState<Cor>(corInicial);
  
  // Tamanho selecionado
  const [tamSel, setTamSel] = useState<Tamanho | null>(null);

  // -----------------------------------------
  // DADOS AUXILIARES
  // -----------------------------------------
  // Descrição de cada tamanho em centímetros
  const tamDesc: Record<Tamanho, string> = {
    '38': '23.5cm',
    '39': '24.5cm',
    '40': '25cm',
    '41': '25.5cm',
    '42': '26cm',
    '43': '27cm',
    '44': '27.5cm',
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="flex flex-col gap-4">

      {/* -----------------------------------------
          LINHA 1: MARCA + SKU
          ----------------------------------------- */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-text-hint tracking-widest uppercase">
          {marca}
        </span>
        <span className="w-1 h-1 rounded-full bg-surface-border-mid" />
        <span className="text-[11px] text-text-hint">SKU: {sku}</span>
      </div>

      {/* -----------------------------------------
          LINHA 2: NOME DO PRODUTO
          ----------------------------------------- */}
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-text-primary">
        {nome}
      </h1>

      {/* -----------------------------------------
          LINHA 3: RATING + AVALIAÇÕES + VENDEDOR
          ----------------------------------------- */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Stars rating={rating} size="lg" />
        <span className="text-[13px] font-bold">{rating}</span>
        <a href="#" className="text-xs text-text-muted underline">
          {totalAvaliacoes.toLocaleString('pt-BR')} avaliações
        </a>
        <span className="w-1 h-1 rounded-full bg-surface-border-mid" />
        <span className="text-xs text-text-muted">
          Vendido por{' '}
          <a href="#" className="text-primary font-semibold no-underline">
            {vendedor}
          </a>
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success">
          {vendedorRating}% positivo
        </span>
      </div>

      {/* DIVISOR */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          DESCRIÇÃO DO PRODUTO
          ----------------------------------------- */}
      <p className="text-[13px] text-text-muted leading-relaxed">{descricao}</p>

      {/* DIVISOR */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          SELETOR DE COR
          ----------------------------------------- */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Cor
          </span>
          <span className="text-xs text-text-muted font-medium capitalize">
            {corSel}
          </span>
        </div>

        <div className="flex gap-2">
          {(Object.keys(cores) as Cor[]).map((cor) => (
            <button
              key={cor}
              onClick={() => setCorSel(cor)}
              title={cor}
              className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all flex-shrink-0 ${
                corSel === cor
                  ? 'outline outline-2 outline-primary outline-offset-2'
                  : ''
              }`}
              style={{
                backgroundColor: cores[cor],
                borderColor: cores[cor] === '#f5f5f0' ? '#D1D5DB' : cores[cor],
              }}
            />
          ))}
        </div>
      </div>

      {/* -----------------------------------------
          SELETOR DE TAMANHO
          ----------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Tamanho
            </span>
            {tamSel && (
              <span className="text-xs text-text-muted">— {tamDesc[tamSel]}</span>
            )}
          </div>
          <a href="#" className="text-xs text-primary underline">
            Guia de tamanhos
          </a>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {tamanhos.map((t) => (
            <button
              key={t}
              onClick={() => t !== '40' && setTamSel(t)}
              className={`min-w-[42px] h-[38px] border-[1.5px] bg-white rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center px-2 ${
                tamSel === t
                  ? 'border-primary bg-primary text-white'
                  : t === '40'
                  ? 'opacity-35 cursor-not-allowed line-through border-surface-border text-text-primary'
                  : 'border-surface-border text-text-primary hover:border-primary-mid'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-text-hint mt-1.5">
          Tam. 40 indisponível
        </div>
      </div>

      {/* DIVISOR */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          MODALIDADE DE PREÇO (ATUALIZADO - ESTADO GLOBAL)
          ----------------------------------------- */}
      {/* 
        ANTES: ProductInfo tinha estado interno e renderizava seu próprio seletor
        AGORA: Usa PricingModalities com props do pai (estado global)
        RESULTADO: Clique aqui atualiza o BuyBox (coluna 3) automaticamente
      */}
      <PricingModalities
        modalidades={modalidadesDisponiveis}
        modalidadeAtiva={modalidadeAtiva}
        onSelecionarModalidade={onTrocarModalidade}
      />

      {/* DIVISOR */}
      <div className="h-px bg-surface-border w-full" />

      {/* -----------------------------------------
          CHAT COM VENDEDOR
          ----------------------------------------- */}
      <ChatVendedor
        vendedorNome={vendedor}
        status="online"
        tempoResposta="Responde em minutos"
        onClick={() => {
          console.log('Abrir chat com:', vendedor);
        }}
      />
    </div>
  );
}