import type {
  DimensoesPacote,
  ItemLogistico,
  OpcaoFrete,
  PacoteEnvio,
} from "./contratos-frete";
import type { DisponibilidadeFreteExterno } from "./disponibilidade-frete-externo";

export type EfeitoRegraDisponibilidadeFrete = "permitir" | "bloquear";

export type LimitesGlobaisFrete = {
  pesoMaximoEmGramas?: number | null;
  alturaMaximaEmCm?: number | null;
  larguraMaximaEmCm?: number | null;
  comprimentoMaximoEmCm?: number | null;
};

export type ProvedorDisponibilidadeFrete = {
  identificador: string;
  ativo: boolean;
};

export type TransportadoraDisponibilidadeFrete = LimitesGlobaisFrete & {
  identificador: string;
  nome: string;
  provedorIdentificador: string;
  ativo: boolean;
};

export type ServicoDisponibilidadeFrete = LimitesGlobaisFrete & {
  identificador: string;
  provedorIdentificador: string;
  transportadoraIdentificador?: string | null;
  ativo: boolean;
};

export type RegraDisponibilidadeFrete = {
  efeito: EfeitoRegraDisponibilidadeFrete;
  provedorIdentificador?: string | null;
  transportadoraIdentificador?: string | null;
  servicoIdentificador?: string | null;
  ativo?: boolean;
};

export type RegraCategoriaDisponibilidadeFrete = RegraDisponibilidadeFrete & {
  categoriaId: string;
};

export type RegraProdutoDisponibilidadeFrete = RegraDisponibilidadeFrete & {
  produtoId: string;
};

export type RegraTipoLogisticoDisponibilidadeFrete =
  RegraDisponibilidadeFrete & {
    tipoLogisticoIdentificador: string;
  };

export type ContextoProdutoDisponibilidadeFrete = {
  produtoId: string;
  varianteId?: string | null;
  categoriaId?: string | null;
  tiposLogisticosIdentificadores: string[];
  /** Origem necessária para isolar contratos logísticos de fornecedores. */
  origemExpedicao?: "loja" | "fornecedor";
  fornecedorProvedor?: string | null;
  /**
   * Gate de disponibilidade do Frete Externo (Produto > Categoria > padrão).
   * Ausente = comportamento histórico (ativado).
   */
  freteExterno?: DisponibilidadeFreteExterno;
};

export type VolumesDisponibilidadeFrete = {
  itens: ItemLogistico[];
  pacotes: PacoteEnvio[];
};

export type ConfiguracaoDisponibilidadeFrete = {
  provedores: ProvedorDisponibilidadeFrete[];
  transportadoras: TransportadoraDisponibilidadeFrete[];
  servicos: ServicoDisponibilidadeFrete[];
  regrasCategorias: RegraCategoriaDisponibilidadeFrete[];
  regrasProdutos: RegraProdutoDisponibilidadeFrete[];
  regrasTiposLogisticos: RegraTipoLogisticoDisponibilidadeFrete[];
};

export type DisponibilidadeFreteProduto = {
  contextoProduto: ContextoProdutoDisponibilidadeFrete;
  configuracao: ConfiguracaoDisponibilidadeFrete;
};

export type VolumeDisponibilidadeFrete = {
  pesoEmGramas: number;
  dimensoes: DimensoesPacote;
};

export type MotivoIndisponibilidadeFrete =
  | "frete-externo-desativado"
  | "provedor-inativo"
  | "transportadora-inativa"
  | "servico-inativo"
  | "limite-global-peso"
  | "limite-global-dimensoes"
  | "regra-tipo-logistico"
  | "regra-produto"
  | "regra-categoria";

export type ResultadoDisponibilidadeOpcaoFrete = {
  opcao: OpcaoFrete;
  disponivel: boolean;
  motivo?: MotivoIndisponibilidadeFrete;
  servicoConhecido: boolean;
  transportadoraConhecida: boolean;
};
