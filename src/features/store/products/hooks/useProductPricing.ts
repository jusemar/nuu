// ==========================================
// HOOK: useProductPricing
// ==========================================
// Responsabilidade: Gerenciar estado das modalidades de preço
// O que faz: 
//   - Recebe array de preços do DB
//   - Controla qual modalidade está selecionada
//   - Formata valores (centavos → R$)
//   - Calcula parcelamentos
//
// Por que existe: Centraliza lógica de preços fora dos componentes visuais
// (separar responsabilidades = código mais fácil de manter)

'use client'; // Hook roda no navegador (useState)

import { useState, useMemo } from 'react';
import type { PrecoModalidade, Modalidade } from '../types/product.types';

// ==========================================
// INTERFACE DO RETORNO (o que o hook devolve)
// ==========================================
interface UseProductPricingReturn {
  // Dados da modalidade ATIVA (selecionada pelo usuário)
  modalidadeAtiva: PrecoModalidade;
  
  // Todas as modalidades disponíveis (para o seletor)
  modalidadesDisponiveis: PrecoModalidade[];
  
  // Função para trocar de modalidade
  selecionarModalidade: (tipo: Modalidade) => void;
  
  // Valores já FORMATADOS para exibição (strings)
  precoPixFormatado: string;      // "R$ 679,91"
  precoNormalFormatado: string;   // "R$ 799,90"
  precoParceladoFormatado: string; // "3x de R$ 266,63"
  descontoPix: number;             // 15 (% de desconto)
  
  // Prazo de entrega da modalidade ativa
  prazoEntrega: string;
}

// ==========================================
// FUNÇÃO UTILITÁRIA: Formatar centavos → R$
// ==========================================
// O DB guarda preço em centavos (ex: 67991)
// O usuário vê em reais (ex: "R$ 679,91")
function formatarPreco(centavos: number): string {
  const reais = centavos / 100; // Divide por 100
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// ==========================================
// FUNÇÃO UTILITÁRIA: Calcular parcelamento
// ==========================================
// Regra de negócio: até 3x sem juros, acima com juros
function calcularParcelamento(valorCentavos: number): string {
  const valorReais = valorCentavos / 100;
  
  // Até 3x sem juros
  const maxParcelasSemJuros = 3;
  const parcelaSemJuros = valorReais / maxParcelasSemJuros;
  
  return `${maxParcelasSemJuros}x de ${parcelaSemJuros.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })}`;
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================
export function useProductPricing(
  precos: PrecoModalidade[] // ← Recebe do Server Component (props)
): UseProductPricingReturn {
  
  // -----------------------------------------
  // ESTADO: Qual modalidade está selecionada?
  // -----------------------------------------
  // useState guarda valor entre renderizações
  // Inicializa com a PRIMEIRA modalidade ativa do array
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<Modalidade>(() => {
    // Filtra só as ativas (isActive = true)
    const ativas = precos.filter(p => p.isActive);
    // Pega a primeira ou 'stock' como fallback
    return ativas[0]?.type || 'stock';
  });

  // -----------------------------------------
  // MEMORIZAÇÃO: Encontra objeto completo da modalidade ativa
  // -----------------------------------------
  // useMemo = só recalcula quando 'precos' ou 'modalidadeSelecionada' mudam
  // (performance: evita busca no array toda hora)
  const modalidadeAtiva = useMemo(() => {
    const encontrada = precos.find(p => p.type === modalidadeSelecionada);
    // Se não achar (edge case), pega a primeira ativa
    return encontrada || precos.find(p => p.isActive) || precos[0];
  }, [precos, modalidadeSelecionada]);

  // -----------------------------------------
  // MEMORIZAÇÃO: Todas as modalidades ativas (para o seletor)
  // -----------------------------------------
  const modalidadesDisponiveis = useMemo(() => {
    return precos.filter(p => p.isActive); // Só mostra as ativas no DB
  }, [precos]);

  // -----------------------------------------
  // MEMORIZAÇÃO: Valores formatados para exibição
  // -----------------------------------------
  const {
    precoPixFormatado,
    precoNormalFormatado,
    precoParceladoFormatado,
    descontoPix,
    prazoEntrega,
  } = useMemo(() => {
    // Preço base: promo ou normal?
    const precoBase = modalidadeAtiva.hasPromo && modalidadeAtiva.promoPrice
      ? modalidadeAtiva.promoPrice
      : modalidadeAtiva.price;

    // Preço "normal" (sem desconto PIX) = base + 15% (simulação)
    // Futuro: virá do DB como preço de cartão
    const precoNormal = Math.round(precoBase * 1.15);

    // Cálculo do desconto PIX
    const desconto = Math.round((1 - precoBase / precoNormal) * 100);

    return {
      precoPixFormatado: formatarPreco(precoBase),
      precoNormalFormatado: formatarPreco(precoNormal),
      precoParceladoFormatado: calcularParcelamento(precoBase),
      descontoPix: desconto,
      prazoEntrega: modalidadeAtiva.deliveryDays || 'Consulte prazo',
    };
  }, [modalidadeAtiva]);

  // -----------------------------------------
  // FUNÇÃO: Trocar modalidade (usuário clicou em outra)
  // -----------------------------------------
  function selecionarModalidade(tipo: Modalidade) {
    // Só troca se existir e estiver ativa
    const existe = precos.find(p => p.type === tipo && p.isActive);
    if (existe) {
      setModalidadeSelecionada(tipo);
    }
  }

  // -----------------------------------------
  // RETORNO: Tudo que o componente precisa
  // -----------------------------------------
  return {
    modalidadeAtiva,
    modalidadesDisponiveis,
    selecionarModalidade,
    precoPixFormatado,
    precoNormalFormatado,
    precoParceladoFormatado,
    descontoPix,
    prazoEntrega,
  };
}