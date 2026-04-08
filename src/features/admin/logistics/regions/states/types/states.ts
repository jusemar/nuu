/**
 * TIPOS DE ESTADOS - Regiões de Atendimento
 */

export interface State {
  uf: string;
  name: string;
  isActive: boolean;
  citiesCount: number;
  createdAt: Date;
}