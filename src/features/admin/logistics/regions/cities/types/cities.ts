/**
 * TIPOS DE CIDADES - Regiões de Atendimento
 */

export interface City {
  /** ID único da cidade */
  id: string;
  
  /** Nome da cidade */
  name: string;
  
  /** UF do estado (SP, RJ, etc) */
  stateUf: string;
  
  /** Se atendemos esta cidade */
  isActive: boolean;
  
  /** Quantos bairros específicos estão cadastrados (0 = atende cidade toda) */
  neighborhoodsCount: number;
  
  /** Métodos de entrega disponíveis nesta cidade */
  availableMethods: string[];
  
  /** Quando foi adicionada */
  createdAt: Date;
}