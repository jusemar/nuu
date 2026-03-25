// ==========================================
// PRODUCT SERVICE - Conexão com banco de dados
// ==========================================
// ATUALMENTE: Retorna dados mockados (simulação)
// FUTURO: Substituir por queries Drizzle ORM
// 
// DICA: Services isolam a lógica de acesso a dados dos componentes
// Se mudar de Drizzle para Prisma, muda apenas aqui

import type { Produto } from '../types/product.types';
import { produto as produtoMock } from '../constants/mockData';

// ==========================================
// TIPOS DE RESPOSTA DA API
// ==========================================

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// ==========================================
// FUNÇÕES DO SERVICE
// ==========================================

/**
 * Busca um produto pelo SKU (identificador único)
 * 
 * @param sku - Código do produto (ex: "ATH-RUN-PRX-42")
 * @returns Promise com o produto ou erro
 * 
 * EXEMPLO DE USO:
 * const { data, error, loading } = await getProductBySku("ATH-RUN-PRX-42");
 */
export async function getProductBySku(sku: string): Promise<ApiResponse<Produto>> {
  // SIMULAÇÃO: Delay de rede (1 segundo)
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // SIMULAÇÃO: Verifica se SKU existe
  if (sku !== produtoMock.sku) {
    return {
      data: null,
      error: "Produto não encontrado",
      loading: false,
    };
  }
  
  // Retorna produto mockado
  return {
    data: produtoMock,
    error: null,
    loading: false,
  };
}

/**
 * Busca produto por slug (para URLs amigáveis)
 * 
 * @param slug - Slug da URL (ex: "aether-run-pro-x")
 * @returns Promise com o produto ou erro
 * 
 * EXEMPLO DE USO:
 * const produto = await getProductBySlug("aether-run-pro-x");
 */
export async function getProductBySlug(slug: string): Promise<ApiResponse<Produto>> {
  // SIMULAÇÃO: Delay de rede
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  // SIMULAÇÃO: Converte slug para verificação
  // No futuro: SELECT * FROM products WHERE slug = ${slug}
  const expectedSlug = produtoMock.nome
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  
  if (slug !== expectedSlug) {
    return {
      data: null,
      error: "Produto não encontrado",
      loading: false,
    };
  }
  
  return {
    data: produtoMock,
    error: null,
    loading: false,
  };
}

/**
 * Busca produtos relacionados (upsell)
 * 
 * @param sku - SKU do produto atual
 * @param limit - Quantidade de itens (padrão: 4)
 * @returns Lista de produtos relacionados
 * 
 * EXEMPLO DE USO:
 * const relacionados = await getRelatedProducts("ATH-RUN-PRX-42", 4);
 */
export async function getRelatedProducts(
  sku: string,
  limit: number = 4
): Promise<ApiResponse<Produto["upsell"]>> {
  // SIMULAÇÃO: Busca no banco
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Retorna apenas os itens upsell do produto mock
  const relacionados = produtoMock.upsell.slice(0, limit);
  
  return {
    data: relacionados,
    error: null,
    loading: false,
  };
}

/**
 * Verifica disponibilidade de estoque
 * 
 * @param sku - SKU do produto
 * @param tamanho - Tamanho desejado
 * @param quantidade - Quantidade desejada
 * @returns Se tem estoque suficiente
 * 
 * EXEMPLO DE USO:
 * const disponivel = await checkStock("ATH-RUN-PRX-42", "42", 2);
 */
export async function checkStock(
  sku: string,
  tamanho: string,
  quantidade: number
): Promise<{ disponivel: boolean; estoqueAtual: number }> {
  // SIMULAÇÃO: Verifica estoque
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // Simula: tamanho 40 está esgotado (conforme seu código original)
  if (tamanho === "40") {
    return { disponivel: false, estoqueAtual: 0 };
  }
  
  const estoqueAtual = produtoMock.estoque;
  const disponivel = estoqueAtual >= quantidade;
  
  return { disponivel, estoqueAtual };
}

// ==========================================
// FUTURO: Integração com Drizzle ORM
// ==========================================
// Quando conectar ao banco, descomente e adapte:
/*
import { db } from '@/lib/db';
import { products } from '@/db/schema';

export async function getProductBySkuDrizzle(sku: string) {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);
  
  return result[0] || null;
}
*/