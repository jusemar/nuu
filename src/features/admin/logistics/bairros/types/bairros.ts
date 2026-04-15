/**
 * TIPOS DE BAIRROS - Controle de entregas por região
 * 
 * Cada bairro tem faixa de CEP e slots de dia/horário para entrega.
 * Usado apenas para entrega própria (controle total da logística).
 */

/**
 * Slot de entrega - dia e horário específico
 */
export interface SlotEntrega {
  /** ID único do slot */
  id: string;
  
  /** Dia da semana (0=Domingo, 1=Segunda...) */
  diaSemana: number;
  
  /** Nome do dia para exibição */
  diaNome: string;
  
  /** Horário de início (ex: "08:00") */
  horarioInicio: string;
  
  /** Horário de fim (ex: "13:00") */
  horarioFim: string;
  
  /** Preço do frete neste slot */
  preco: number;
  
  /** Se está ativo */
  isActive: boolean;
}

/**
 * Faixa de CEP do bairro
 */
export interface FaixaCep {
  /** CEP inicial (ex: "01400000") */
  inicio: string;
  
  /** CEP final (ex: "01599999") */
  fim: string;
  
  /** Formato exibido: "01400-000 a 01599-999" */
  display: string;
}

/**
 * Bairro completo com configuração de entrega
 */
export interface Bairro {
  /** ID único */
  id: string;
  
  /** Nome do bairro (ex: "Jardins") */
  nome: string;
  
  /** Cidade (ex: "São Paulo") */
  cidade: string;
  
  /** UF (ex: "SP") */
  estadoUf: string;
  
  /** Faixa de CEP do bairro */
  faixaCep: FaixaCep;
  
  /** Slots de entrega disponíveis */
  slots: SlotEntrega[];
  
  /** Se tem algum slot ativo */
  hasSlotsActive: boolean;
  
  /** Se está ativo no sistema */
  isActive: boolean;
  
  /** Quantidade de entregas realizadas (histórico) */
  totalEntregas?: number;
  
  /** Quando foi criado */
  createdAt: Date;
  
  /** Quando foi atualizado */
  updatedAt: Date;
}

/**
 * Filtros para busca de bairros
 */
export interface FiltrosBairro {
  cidade?: string;
  estadoUf?: string;
  apenasAtivos?: boolean;
}