// ==========================================
// TIPOS BÁSICOS (Enums do projeto)
// ==========================================

/** Modalidades de compra disponíveis */
export type Modalidade = "estoque" | "prevenda" | "drop" | "fabrica";

/** Abas de navegação na página de detalhes */
export type Aba = "descricao" | "especificacoes" | "avaliacoes" | "entrega";

/** Cores disponíveis para o produto */
export type Cor = "preto" | "branco" | "azul" | "vermelho";

/** Tamanhos de calçados (BR) */
export type Tamanho = "38" | "39" | "40" | "41" | "42" | "43" | "44";

// ==========================================
// INTERFACES DE DADOS
// ==========================================

/** Uma avaliação de cliente */
export interface Avaliacao {
  nome: string;           // Nome do cliente
  data: string;           // Data formatada (ex: "12 Mar 2025")
  estrelas: number;       // 1 a 5
  comentario: string;     // Texto da avaliação
  iniciais: string;       // Iniciais para avatar (ex: "RM")
  cor: string;            // Cor de fundo do avatar
}

/** Especificação técnica do produto */
export interface Especificacao {
  label: string;          // Nome da espec (ex: "Material")
  valor: string;          // Valor (ex: "Couro")
}

/** Item para venda cruzada (compre junto) */
export interface UpsellItem {
  nome: string;
  preco: string;          // Formatado (ex: "R$ 89,90")
  img: string;            // URL da imagem
  tag: string | null;     // "Mais vendido", "Novo", etc
}

/** Dados completos de um produto */
export interface Produto {
  nome: string;
  marca: string;
  sku: string;
  vendedor: string;
  vendedorRating: number; // Percentual (ex: 98)
  descricao: string;
  imagens: string[];      // Array de URLs
  cores: Record<Cor, string>; // { preto: "#1a1a1a", ... }
  tamanhos: Tamanho[];
  rating: number;         // Média (ex: 4.8)
  totalAvaliacoes: number;
  estoque: number;        // Quantidade disponível
  especificacoes: Especificacao[];
  avaliacoes: Avaliacao[];
  upsell: UpsellItem[];
}

// ==========================================
// INTERFACES DE NEGÓCIO (Modalidades, Frete, etc)
// ==========================================

/** Configuração de cada modalidade de preço */
export interface ModalidadeInfo {
  label: string;          // Nome exibido (ex: "Estoque Próprio")
  badge: string;          // Texto do selo (ex: "Entrega rápida")
  badgeBg: string;        // Cor de fundo do selo
  badgeColor: string;     // Cor do texto do selo
  precoNormal: string;    // Preço no cartão (ex: "R$ 799,90")
  precoParc: string;      // Parcelamento (ex: "3x de R$ 253,97")
  precoPix: string;       // Preço no PIX (ex: "R$ 679,91")
  prazo: string;          // Prazo de entrega
  envia: string;          // Quem envia (ex: "Sport Elite Store")
  garantia: string;       // Tempo de garantia
  icon: string;           // Emoji ou ícone
}

/** Transportadora disponível para entrega */
export interface Transportadora {
  nome: string;
  prazo: string;          // "5 dias úteis"
  valor: string;          // "Grátis" ou "R$ 18,90"
  destaque: boolean;      // Se é a recomendada
}

/** Opção de parcelamento no cartão */
export interface Parcelamento {
  parcelas: number;
  valor: string;          // Valor da parcela (ex: "R$ 266,63")
  total: string;          // Total pago (ex: "R$ 799,90")
  semJuros: boolean;      // Se é sem juros
}

/** Cupom de desconto aplicado */
export interface Cupom {
  desconto: number;       // Percentual (ex: 10)
  label: string;          // Descrição (ex: "10% de desconto...")
  code: string;           // Código digitado (ex: "PRIMEIRA10")
}

// ==========================================
// TIPOS DE ESTADO (useState)
// ==========================================

/** Estado do cupom no componente */
export type CupomState = 
  | { status: 'idle' }           // Nenhum cupom
  | { status: 'applied'; data: Cupom }  // Cupom válido aplicado
  | { status: 'error'; message: string }; // Cupom inválido