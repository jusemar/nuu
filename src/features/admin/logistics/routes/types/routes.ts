/**
 * TIPOS DE ROTAS DE ENTREGA
 * 
 * Define estrutura de rotas de entrega própria com faixas de CEP e slots.
 * Usado apenas para entrega própria (controle total da logística).
 */

/**
 * Slot de entrega - dia e horário específico de uma rota
 */
export interface DeliverySlot {
  /** ID único do slot */
  id: string;
  
  /** ID da rota pai */
  routeId: string;
  
  /** Dia da semana (0=Domingo, 6=Sábado) */
  dayOfWeek: number;
  
  /** Nome do dia para exibição */
  dayName: string;
  
  /** Horário de início (ex: "08:00") */
  startTime: string;
  
  /** Horário de fim (ex: "13:00") */
  endTime: string;
  
  /** Valor do frete em centavos (ex: 1000 = R$ 10,00) */
  shippingPrice: number;
  
  /** Se está ativo */
  isActive: boolean;
}

/**
 * Tipos de rota de entrega
 */
export type RouteType = 'RANGE' | 'SPECIFIC';

/**
 * Resposta da API ViaCEP
 */
export interface ViaCepResponse {
  /** CEP consultado */
  cep: string;
  
  /** Logradouro (rua) */
  logradouro: string;
  
  /** Complemento */
  complemento: string;
  
  /** Bairro */
  bairro: string;
  
  /** Cidade */
  localidade: string;
  
  /** UF */
  uf: string;
  
  /** Código IBGE */
  ibge: string;
  
  /** Se houve erro */
  erro?: boolean;
}

/**
 * Estados do campo bairro no formulário
 */
export type BairroFieldState = 
  | 'idle'        // Estado inicial, vazio
  | 'loading'     // Buscando na API
  | 'suggested'   // API retornou sugestão
  | 'confirmed'   // Admin confirmou sugestão
  | 'manual'      // Admin digitou manualmente
  | 'error';      // API falhou

/**
 * Rota de entrega completa
 */
export interface DeliveryRoute {
  /** ID único */
  id: string;
  
  /** Nome da rota (ex: "Zona Sul — Jardins") */
  name: string;
  
  /** Tipo da rota (sempre RANGE para entrega própria) */
  type: RouteType;
  
  /** CEP inicial sem hífen (ex: "01400000") */
  cepStart: string;
  
  /** CEP final sem hífen (ex: "01599999") */
  cepEnd: string;
  
  /** CEP inicial formatado para exibição */
  cepStartDisplay: string;
  
  /** CEP final formatado para exibição */
  cepEndDisplay: string;
  
  /** Bairro retornado pela API ViaCEP (para auditoria) */
  officialNeighborhood: string | null;
  
  /** Bairro confirmado/corrigido pelo admin */
  registeredNeighborhood: string;
  
  /** Cidade */
  city: string;
  
  /** UF */
  state: string;
  
  /** Slots de entrega disponíveis */
  slots: DeliverySlot[];
  
  /** Se tem algum slot ativo */
  hasActiveSlots: boolean;
  
  /** Se está ativa no sistema */
  isActive: boolean;
  
  /** Quando foi criada */
  createdAt: Date;
  
  /** Quando foi atualizada */
  updatedAt: Date;
}

/**
 * Dados para criar nova rota (formulário)
 */
export interface CreateRouteData {
  name: string;
  cepStart: string;
  cepEnd: string;
  officialNeighborhood: string | null;
  registeredNeighborhood: string;
  city: string;
  state: string;
  slots: Omit<DeliverySlot, 'id' | 'routeId'>[];
}

/**
 * Resultado do teste de CEP
 */
export interface CepTestResult {
  /** Se encontrou rota */
  found: boolean;
  
  /** Rota encontrada (se houver) */
  route?: DeliveryRoute;
  
  /** Slots disponíveis (se houver) */
  availableSlots?: DeliverySlot[];
  
  /** Mensagem para o admin */
  message: string;
}