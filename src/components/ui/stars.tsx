// ==========================================
// COMPONENTE UI: Stars
// ==========================================
// Responsabilidade: Mostrar estrelas de avaliação (rating)
// O que faz: Renderiza 5 estrelas, preenchendo conforme a nota recebida
// Localização: src/components/ui/ (pasta de componentes genéricos reutilizáveis)
// 
// DICA: Componentes em src/components/ui/ podem ser usados em QUALQUER
// lugar do projeto (produtos, reviews, perfil, etc), não só na feature de produtos.

import React from 'react';

// ==========================================
// INTERFACE DAS PROPS
// ==========================================
interface StarsProps {
  /** Nota de avaliação de 0 a 5 (ex: 4.8) */
  rating: number;
  
  /** Tamanho das estrelas: 'sm' (pequeno) ou 'lg' (grande) */
  size?: 'sm' | 'lg';
  
  /** Classe CSS adicional (opcional) - permite customizar desde quem usa */
  className?: string;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
/**
 * Componente Stars - Estrelas de avaliação
 * 
 * Exemplo de uso:
 * <Stars rating={4.8} size="lg" />
 * <Stars rating={3.5} size="sm" className="mt-2" />
 */
export function Stars({ 
  rating, 
  size = 'sm', 
  className = '' 
}: StarsProps) {
  
  // Arredonda o rating para o inteiro mais próximo
  // Ex: 4.8 vira 5, 4.2 vira 4
  const estrelasPreenchidas = Math.round(rating);
  
  // Define o tamanho da fonte baseado na prop size
  const tamanhoFonte = size === 'lg' ? 'text-[15px]' : 'text-[11px]';

  return (
    // Container das estrelas em linha
    // inline-flex: flexbox que não quebra linha (fica na mesma linha do texto)
    // gap-0.5: espaçamento de 2px entre as estrelas
    // className: permite adicionar classes extras de fora (margin, etc)
    <span className={`inline-flex gap-0.5 ${className}`}>
      {/* Cria 5 estrelas, do 1 ao 5 */}
      {[1, 2, 3, 4, 5].map((numeroEstrela) => (
       <span
  key={numeroEstrela}
  className={tamanhoFonte}
  style={{
    color: numeroEstrela <= estrelasPreenchidas ? '#EF9F27' : '#D1D5DB'
  }}
>
  ★
</span>
      ))}
    </span>
  );
}

// ==========================================
// EXPORTAÇÃO ADICIONAL (opcional)
// ==========================================
// Também exportamos como default para flexibilidade de importação
export default Stars;