// ==========================================
// MOCK DATA - Dados fictícios para testes
// ==========================================
// Estes dados simulam o que viria do banco de dados
// Quando conectar ao Drizzle, substitua por chamadas reais

import type { 
  Produto, 
  ModalidadeInfo, 
  Transportadora, 
  Parcelamento 
} from '../types/product.types';

// ==========================================
// PRODUTO PRINCIPAL
// ==========================================

export const produto: Produto = {
  nome: "Aether Run Pro X",
  marca: "AETHER",
  sku: "ATH-RUN-PRX-42",
  vendedor: "Sport Elite Store",
  vendedorRating: 98,
  descricao: "Performance máxima para quem não aceita menos que o melhor. O Aether Run Pro X combina tecnologia de amortecimento dinâmico AetherFoam v3 com cabedal em malha Flyknit respirável. Placa de carbono integrada para máximo retorno de energia.",
  
  // Galeria de imagens (URLs do Unsplash)
  imagens: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=90",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=90",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&q=90",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=900&q=90",
  ],
  
  // Cores disponíveis com seus códigos hex
  cores: {
    preto: "#1a1a1a",
    branco: "#f5f5f0",
    azul: "#1d4ed8",
    vermelho: "#dc2626",
  },
  
  // Tamanhos disponíveis
  tamanhos: ["38", "39", "40", "41", "42", "43", "44"],
  
  // Avaliações
  rating: 4.8,
  totalAvaliacoes: 2341,
  estoque: 47,
  
  // Especificações técnicas (tabela)
  especificacoes: [
    { label: "Material do Cabedal", valor: "Malha Flyknit Pro" },
    { label: "Solado", valor: "Borracha vulcanizada grip 360°" },
    { label: "Amortecimento", valor: "AetherFoam v3 + Placa de carbono" },
    { label: "Peso", valor: "228g (par no 42)" },
    { label: "Drop", valor: "8mm" },
    { label: "Indicado para", valor: "Asfalto, pista e esteira" },
    { label: "Garantia", valor: "12 meses" },
    { label: "Origem", valor: "Brasil" },
  ],
  
  // Avaliações de clientes
  avaliacoes: [
    {
      nome: "Rodrigo M.",
      data: "12 Mar 2025",
      estrelas: 5,
      comentario: "Melhor tênis que já usei para corrida. O amortecimento é incrível e meu joelho não dói mais após treinos longos.",
      iniciais: "RM",
      cor: "#EFF6FF", // primary-light
    },
    {
      nome: "Camila S.",
      data: "8 Mar 2025",
      estrelas: 5,
      comentario: "Leve, confortável e com um design impecável. Recebi em 2 dias pelo estoque próprio. Super recomendo!",
      iniciais: "CS",
      cor: "#F0FDFA", // success-light
    },
    {
      nome: "Felipe A.",
      data: "1 Mar 2025",
      estrelas: 4,
      comentario: "Produto excelente, só fiquei sem 1 estrela porque o tamanho fechou um pouco. Peça meio número acima.",
      iniciais: "FA",
      cor: "#FFFBEB", // accent-light
    },
  ],
  
  // Produtos "Compre Junto" (upsell)
  upsell: [
    {
      nome: "Meia Compressão Pro",
      preco: "R$ 89,90",
      img: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80",
      tag: "Mais vendido",
    },
    {
      nome: "Bolsa Running Pack",
      preco: "R$ 249,90",
      img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
      tag: null,
    },
    {
      nome: "Óculos Sport Shield",
      preco: "R$ 319,90",
      img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
      tag: "Novo",
    },
    {
      nome: "Camiseta Dry-Fit Ultra",
      preco: "R$ 149,90",
      img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
      tag: null,
    },
  ],
};

// ==========================================
// MODALIDADES DE PREÇO
// ==========================================
// Cada modalidade tem preços e prazos diferentes

export const modalidades: Record<string, ModalidadeInfo> = {
  estoque: {
    label: "Estoque Próprio",
    badge: "Entrega rápida",
    badgeBg: "#F0FDFA",      // success-light
    badgeColor: "#14B8A6",   // success
    precoNormal: "R$ 799,90",
    precoParc: "3x de R$ 253,97 sem juros",
    precoPix: "R$ 679,91",
    prazo: "2 a 5 dias úteis",
    envia: "Sport Elite Store",
    garantia: "12 meses",
    icon: "🏪",
  },
  
  prevenda: {
    label: "Pré-Venda",
    badge: "Reserve já",
    badgeBg: "#EFF6FF",      // primary-light
    badgeColor: "#0C447C",   // primary
    precoNormal: "R$ 749,90",
    precoParc: "3x de R$ 237,97 sem juros",
    precoPix: "R$ 637,41",
    prazo: "15 a 25 dias úteis",
    envia: "Sport Elite Store",
    garantia: "12 meses",
    icon: "📅",
  },
  
  drop: {
    label: "Dropshipping",
    badge: "Direto do fornecedor",
    badgeBg: "#EDE7F6",
    badgeColor: "#6D28D9",
    precoNormal: "R$ 699,90",
    precoParc: "3x de R$ 221,97 sem juros",
    precoPix: "R$ 594,91",
    prazo: "10 a 18 dias úteis",
    envia: "Fornecedor Central",
    garantia: "6 meses",
    icon: "🚚",
  },
  
  fabrica: {
    label: "Fábrica / Lote",
    badge: "Menor preço",
    badgeBg: "#FFFBEB",      // accent-light
    badgeColor: "#B45309",   // accent-dark
    precoNormal: "R$ 599,90",
    precoParc: "3x de R$ 189,97 sem juros",
    precoPix: "R$ 509,91",
    prazo: "30 a 45 dias úteis",
    envia: "Fábrica Parceira",
    garantia: "6 meses",
    icon: "🏭",
  },
};

// ==========================================
// TRANSPORTADORAS
// ==========================================

export const transportadoras: Transportadora[] = [
  {
    nome: "Total Express",
    prazo: "5 dias úteis",
    valor: "Grátis",
    destaque: true,
  },
  {
    nome: "Correios PAC",
    prazo: "4 dias úteis",
    valor: "R$ 18,90",
    destaque: false,
  },
  {
    nome: "Correios SEDEX",
    prazo: "2 dias úteis",
    valor: "R$ 34,90",
    destaque: false,
  },
  {
    nome: "Jadlog Package",
    prazo: "3 dias úteis",
    valor: "R$ 22,90",
    destaque: false,
  },
];

// ==========================================
// PARCELAMENTOS
// ==========================================

export const parcelamentos: Parcelamento[] = [
  { parcelas: 1, valor: "R$ 799,90", total: "R$ 799,90", semJuros: true },
  { parcelas: 2, valor: "R$ 399,95", total: "R$ 799,90", semJuros: true },
  { parcelas: 3, valor: "R$ 266,63", total: "R$ 799,90", semJuros: true },
  { parcelas: 4, valor: "R$ 207,98", total: "R$ 831,92", semJuros: false },
  { parcelas: 5, valor: "R$ 168,46", total: "R$ 842,30", semJuros: false },
  { parcelas: 6, valor: "R$ 142,30", total: "R$ 853,80", semJuros: false },
  { parcelas: 8, valor: "R$ 109,72", total: "R$ 877,76", semJuros: false },
  { parcelas: 10, valor: "R$ 89,65", total: "R$ 896,50", semJuros: false },
];

// ==========================================
// CUPONS VÁLIDOS
// ==========================================

export const cuponsValidos: Record<string, { desconto: number; label: string }> = {
  PRIMEIRA10: { desconto: 10, label: "10% de desconto para novos clientes" },
  FRETE15: { desconto: 15, label: "15% OFF especial" },
  RUN20: { desconto: 20, label: "20% para corredores" },
};

// Constante global para frete grátis
export const FRETE_GRATIS_MIN = 299;