// ==========================================
// TIPOS HÍBRIDOS: Reais do DB + Mock temporário
// ==========================================
// Estratégia: MVP - Subir com dados reais essenciais, mockar o resto
// Reais: produto base, preços, imagens da galeria
// Mock: avaliações, upsell, frete, cupons (implementar depois)

// ==========================================
// TIPOS BÁSICOS (Enums do projeto)
// ==========================================

/** Modalidades de compra disponíveis - vem do DB (product_pricing.type) */
export type Modalidade = "stock" | "pre_sale" | "dropshipping" | "order_basis";

/** Abas de navegação na página de detalhes - apenas UI */
export type Aba = "descricao" | "especificacoes" | "avaliacoes" | "entrega";

/** Cores disponíveis para o produto - MOCK (futuro: variants) */
export type Cor = "preto" | "branco" | "azul" | "vermelho";

/** Tamanhos de calçados (BR) - MOCK (futuro: variants) */
export type Tamanho = "38" | "39" | "40" | "41" | "42" | "43" | "44";

// ==========================================
// INTERFACES DE DADOS REAIS (do Drizzle Schema)
// ==========================================

/**
 * Produto base - mapeia 1:1 com productTable do Drizzle
 * Campos obrigatórios que vêm do banco de dados
 */
export interface ProdutoReal {
  id: string;                    // uuid do DB
  name: string;                  // nome do produto
  slug: string;                  // URL amigável (único)
  description: string;           // descrição completa
  brand: string | null;         // marca (ex: "Nike")
  sku: string;                   // código SKU
  cardShortText: string | null;  // texto curto para cards
  status: string;                // 'draft' | 'published' | 'archived'
  isActive: boolean;             // se está ativo no site
  createdAt: Date;               // data de criação
  updatedAt: Date;               // data de atualização
}

/**
 * Imagem da galeria - mapeia productGalleryImagesTable
 * Ordenada por sortOrder, uma é primária (destaque)
 */
export interface ImagemGaleria {
  id: string;           // uuid da imagem
  imageUrl: string;     // URL pública da imagem
  altText: string | null; // texto alternativo (SEO)
  isPrimary: boolean;   // true = imagem principal (capa)
  sortOrder: number;    // ordem de exibição (0, 1, 2...)
}

/**
 * Preço por modalidade - mapeia productPricingTable
 * Cada produto pode ter até 4 modalidades: stock, pre_sale, dropshipping, order_basis
 */
export interface PrecoModalidade {
  type: Modalidade;           // tipo da modalidade
  price: number;              // preço em centavos (ex: 67991 = R$ 679,91)
  pricingModalDescription: string | null; // descrição (ex: "Estoque Próprio")
  deliveryDays: string | null; // prazo de entrega (ex: "5 dias úteis")
  hasPromo: boolean;          // se tem promoção ativa
  promoPrice: number | null;  // preço promocional em centavos
  promoEndDate: Date | null;  // quando a promo expira
  isActive: boolean;          // se esta modalidade está ativa
}

// ==========================================
// INTERFACES MOCK (serão substituídas depois)
// ==========================================

/** Avaliação de cliente - MOCK (futuro: reviewsTable) */
export interface Avaliacao {
  nome: string;           // Nome do cliente
  data: string;           // Data formatada (ex: "12 Mar 2025")
  estrelas: number;       // 1 a 5
  comentario: string;     // Texto da avaliação
  iniciais: string;       // Iniciais para avatar (ex: "RM")
  cor: string;            // Cor de fundo do avatar
}

/** Especificação técnica - MOCK (futuro: productAttributeTable) */
export interface Especificacao {
  label: string;          // Nome da espec (ex: "Material")
  valor: string;          // Valor (ex: "Couro")
}

/** Item para venda cruzada (compre junto) - MOCK (futuro: upsellTable) */
export interface UpsellItem {
  nome: string;
  preco: string;          // Formatado (ex: "R$ 89,90")
  img: string;            // URL da imagem
  tag: string | null;     // "Mais vendido", "Novo", etc
}

/** Transportadora de entrega - MOCK (futuro: shippingTable) */
export interface Transportadora {
  nome: string;
  prazo: string;          // "5 dias úteis"
  valor: string;          // "Grátis" ou "R$ 18,90"
  destaque: boolean;      // Se é a recomendada
}

/** Opção de parcelamento - MOCK (calculado no frontend) */
export interface Parcelamento {
  parcelas: number;
  valor: string;          // Valor da parcela (ex: "R$ 266,63")
  total: string;          // Total pago (ex: "R$ 799,90")
  semJuros: boolean;      // Se é sem juros
}

/** Cupom de desconto - MOCK (futuro: couponsTable) */
export interface Cupom {
  desconto: number;       // Percentual (ex: 10)
  label: string;          // Descrição (ex: "10% de desconto...")
  code: string;           // Código digitado (ex: "PRIMEIRA10")
}

/** Retirada local - dados reais do banco */
export interface RetiradaLocal {
  nome: string;
  prazoTexto: string;
  prazoCustom: string | null;
  mensagem: string | null;
}

// ==========================================
// INTERFACE COMPLETA (união Real + Mock)
// ==========================================

/**
 * Produto completo para a página de detalhes
 * Combina dados reais do DB + mocks temporários
 * 
 * Quando implementar novas tabelas:
 * 1. Criar interface Real (ex: AvaliacaoReal)
 * 2. Substituir no campo mockado abaixo
 * 3. Atualizar o service para buscar do DB
 */
export interface Produto {
  // === DADOS REAIS (do banco) ===
  id: string;
  nome: string;           // name do DB
  slug: string;
  marca: string;          // brand do DB (fallback: "")
  sku: string;
  descricao: string;      // description do DB
  imagens: ImagemGaleria[]; // gallery images do DB
  precos: PrecoModalidade[]; // pricing do DB - NOVO: array de modalidades
  
  // === DADOS MOCK (implementar depois) ===
  rating: number;         // Média de avaliações (futuro: reviewsTable)
  totalAvaliacoes: number; // Contagem de reviews (futuro)
  vendedor: string;       // Info do vendedor (futuro: sellerTable)
  vendedorRating: number; // Nota do vendedor (futuro)
  cores: Record<Cor, string>; // Cores disponíveis (futuro: variants)
  tamanhos: Tamanho[];    // Tamanhos (futuro: variants)
  estoque: number;        // Quantidade (futuro: inventoryTable)
  especificacoes: Especificacao[]; // Ficha técnica (futuro: attributes)
  avaliacoes: Avaliacao[]; // Reviews (futuro: reviewsTable)
  upsell: UpsellItem[];   // Compre junto (futuro: upsellTable)
  retiradaLocal: RetiradaLocal | null;  // Retirada local configurada no admin
}

// ==========================================
// TIPOS DE ESTADO (useState dos componentes)
// ==========================================

/** Estado do cupom no componente */
export type CupomState = 
  | { status: 'idle' }           // Nenhum cupom
  | { status: 'applied'; data: Cupom }  // Cupom válido aplicado
  | { status: 'error'; message: string }; // Cupom inválido

/** Modalidade selecionada pelo usuário */
export type ModalidadeSelecionada = {
  modalidade: Modalidade;
  dados: PrecoModalidade;
};