// ==========================================
// FORMATTER UTILS - Funções puras de formatação
// ==========================================
// Estas funções não dependem de React, são apenas transformações de dados
// DICA: Funções puras são fáceis de testar (unit tests)

/**
 * Formata número para moeda brasileira (BRL)
 * 
 * @param valor - Número a formatar (ex: 799.90)
 * @returns String formatada (ex: "R$ 799,90")
 * 
 * Exemplo: formatBRL(799.9) → "R$ 799,90"
 */
export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte string de preço para número
 * 
 * @param preco - String com preço (ex: "R$ 799,90")
 * @returns Número (ex: 799.90)
 * 
 * Exemplo: parsePrice("R$ 799,90") → 799.9
 */
export function parsePrice(preco: string): number {
  return parseFloat(preco.replace("R$ ", "").replace(",", "."));
}

/**
 * Formata CEP com hífen (XXXXX-XXX)
 * 
 * @param cep - String com apenas números (ex: "01310100")
 * @returns CEP formatado (ex: "01310-100")
 * 
 * Exemplo: formatCEP("01310100") → "01310-100"
 */
export function formatCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, "").slice(0, 8);
  
  if (numeros.length > 5) {
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  }
  
  return numeros;
}

/**
 * Valida se CEP está completo (8 dígitos)
 * 
 * @param cep - String de CEP (formatado ou não)
 * @returns true se válido, false se inválido
 */
export function isValidCEP(cep: string): boolean {
  const numeros = cep.replace(/\D/g, "");
  return numeros.length === 8;
}

/**
 * Calcula percentual de desconto entre dois preços
 * 
 * @param precoOriginal - Preço original (maior)
 * @param precoDesconto - Preço com desconto (menor)
 * @returns Percentual de desconto (ex: 15)
 * 
 * Exemplo: calculateDiscount(799.90, 679.91) → 15
 */
export function calculateDiscount(precoOriginal: number, precoDesconto: number): number {
  if (precoOriginal <= 0) return 0;
  return Math.round((1 - precoDesconto / precoOriginal) * 100);
}

/**
 * Calcula preço final com cupom aplicado
 * 
 * @param precoBase - Preço original
 * @param descontoPercent - Percentual do cupom (ex: 10)
 * @returns Preço final
 * 
 * Exemplo: applyCoupon(679.91, 10) → 611.919
 */
export function applyCoupon(precoBase: number, descontoPercent: number): number {
  return precoBase * (1 - descontoPercent / 100);
}

/**
 * Calcula progresso para frete grátis (0 a 100)
 * 
 * @param valorAtual - Valor atual do carrinho
 * @param valorMinimo - Valor mínimo para frete grátis
 * @returns Percentual (0 a 100)
 * 
 * Exemplo: calculateShippingProgress(150, 299) → 50
 */
export function calculateShippingProgress(valorAtual: number, valorMinimo: number): number {
  if (valorMinimo <= 0) return 100;
  return Math.min((valorAtual / valorMinimo) * 100, 100);
}

/**
 * Formata data relativa (ex: "12 Mar 2025")
 * 
 * @param date - Date object ou string ISO
 * @returns Data formatada em português
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Gera iniciais a partir do nome
 * 
 * @param nome - Nome completo (ex: "Rodrigo Martins")
 * @returns Iniciais (ex: "RM")
 */
export function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}