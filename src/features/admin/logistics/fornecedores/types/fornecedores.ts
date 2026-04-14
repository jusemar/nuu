/**
 * TIPOS DE FORNECEDORES
 * 
 * Define fornecedores que entregam produtos (incluindo loja própria).
 */

/**
 * Tipos de fornecedor
 */
export type TipoFornecedor = 
  | 'proprio'      // Loja própria - você entrega
  | 'fornecedor'   // Fornecedor externo - drop-shipping
  | 'transportadora'; // Parceiro de transporte

/**
 * Configuração de entrega do fornecedor
 */
export interface ConfiguracaoEntrega {
  /** Prazo mínimo em dias */
  prazoMin: number;
  
  /** Prazo máximo em dias */
  prazoMax: number;
  
  /** Horário de corte para pedidos do mesmo dia */
  horarioCorte: string;
  
  /** Dias úteis de operação (0=Dom, 6=Sáb) */
  diasOperacao: number[];
  
  /** Frete fixo */
  freteFixo?: number;
  
  /** Frete grátis acima de determinado valor */
  freteGratisAcima?: number;
}

/**
 * Fornecedor completo
 */
export interface Fornecedor {
  /** ID único */
  id: string;
  
  /** Nome do fornecedor */
  nome: string;
  
  /** Tipo de fornecedor */
  tipo: TipoFornecedor;
  
  /** Descrição da operação de entrega */
  descricao: string;
  
  /** Se está ativo */
  isActive: boolean;
  
  /** Configuração de entrega */
  configuracao: ConfiguracaoEntrega;
  
  /** Regiões atendidas (UFs) */
  regioesAtendidas: string[];
  
  /** Quantidade de produtos vinculados */
  produtosVinculados: number;
  
  /** Contato */
  contato?: {
    email?: string;
    telefone?: string;
  };
  
  /** Quando foi criado */
  createdAt: Date;
  
  /** Quando foi atualizado */
  updatedAt: Date;
}