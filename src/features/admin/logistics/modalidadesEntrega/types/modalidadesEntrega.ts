/**
 * TIPOS DE MODALIDADES DE ENTREGA
 * 
 * Define como cada modalidade de entrega é configurada no sistema.
 * Cada modalidade tem suas próprias regras de preço, prazo e horário.
 */

/**
 * Tipos de modalidade disponíveis no sistema
 */
export type TipoModalidade = 
  | 'motoboy'           // Entrega rápida em cidade
  | 'transportadora'    // Entrega em todo país
  | 'fornecedor'        // Fornecedor entrega direto
  | 'retirada';         // Cliente retira no local

/**
 * Configuração de preço da modalidade
 */
export interface PrecoModalidade {
  /** Preço fixo (ex: R$ 10,00) */
  fixo?: number;
  
  /** Preço por km (para motoboy) */
  porKm?: number;
  
  /** Preço por peso (para transportadora) */
  porPeso?: number;
  
  /** Frete grátis acima de determinado valor */
  freteGratisAcima?: number;
}

/**
 * Horário de corte para entregas do mesmo dia
 */
export interface HorarioCorte {
  /** Dia da semana (0=Domingo, 6=Sábado) ou 'todos' */
  dia: number | 'todos';
  
  /** Horário limite (ex: "12:00") */
  horario: string;
}

/**
 * Modalidade de entrega completa
 */
export interface ModalidadeEntrega {
  /** ID único */
  id: string;
  
  /** Nome exibido (ex: "Entrega Hoje", "Transportadora Econômica") */
  nome: string;
  
  /** Tipo base da modalidade */
  tipo: TipoModalidade;
  
  /** Descrição para o cliente */
  descricao: string;
  
  /** Se está ativa no momento */
  isActive: boolean;
  
  /** Configuração de preço */
  preco: PrecoModalidade;
  
  /** Prazo de entrega em dias */
  prazoDias: {
    min: number;
    max: number;
  };
  
  /** Horários de corte (para entrega mesmo dia) */
  horariosCorte: HorarioCorte[];
  
  /** Se permite agendamento de data específica */
  permiteAgendamento: boolean;
  
  /** Dias úteis de operação (0-6) */
  diasOperacao: number[];
  
  /** Peso máximo permitido em kg */
  pesoMaximo?: number;
  
  /** Dimensões máximas em cm (C x L x A) */
  dimensoesMaximas?: {
    comprimento: number;
    largura: number;
    altura: number;
  };
  
  /** Quando foi criada */
  createdAt: Date;
  
  /** Quando foi atualizada */
  updatedAt: Date;
}