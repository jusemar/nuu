import type {
  StatusPromocao,
  TipoCampanhaPromocao,
  TipoBeneficioPromocao,
  TipoDescontoPromocao,
} from "./promocoes.types";

export type ProdutoPromocaoAdmin = {
  id: string;
  nome: string;
  slug: string;
  sku: string;
  imagemUrl: string | null;
  precoAtualEmCentavos: number | null;
  modalidade: string | null;
  modalidadesDisponiveis: string[];
};

export type CategoriaPromocaoAdmin = {
  id: string;
  nome: string;
  slug: string;
};

export type MarcaPromocaoAdmin = {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
};

export type RegiaoPromocaoAdmin = {
  codigo: string;
  nome: string;
  tipo: "pais" | "macrorregiao" | "estado" | "cidade" | "regiao_entrega";
  descricao: string | null;
};

export type FreteServicoPromocaoAdmin = {
  codigo: string;
  nome: string;
  tipo: "transportadora" | "servico";
  descricao: string | null;
};

export type SubtotalPromocaoAdmin = {
  id: string;
  subtotalMinimo: number;
  subtotalMaximo: number | null;
};

export type FreteGratisPromocaoAdmin = {
  id: string;
  subtotalMinimo: number;
  modalidade: string | null;
  mensagemProgressiva: string | null;
  regiaoCodigo: string | null;
  transportadoraCodigo: string | null;
  servicoCodigo: string | null;
};

export type PromocaoAdmin = {
  id: string;
  nome: string;
  slug: string;
  status: StatusPromocao;
  tipoBeneficio: TipoBeneficioPromocao;
  tipoCampanha: TipoCampanhaPromocao;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
  prioridade: number;
  acumulativa: boolean;
  dataInicio: Date;
  dataFim: Date | null;
  badgePromocional: string | null;
  countdownPromocionalDataFim: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
  quantidadeProdutos: number;
  quantidadeCategorias: number;
  quantidadeMarcas: number;
  possuiRegraSubtotal: boolean;
  produtos: ProdutoPromocaoAdmin[];
  categorias: CategoriaPromocaoAdmin[];
  marcas: MarcaPromocaoAdmin[];
  subtotais: SubtotalPromocaoAdmin[];
  fretesGratis: FreteGratisPromocaoAdmin[];
};

export type ResultadoPromocoesAdmin = {
  promocoes: PromocaoAdmin[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type CupomPromocaoAdmin = {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
  freteGratis: boolean;
  prioridade: number;
  acumulativo: boolean;
  subtotalMinimo: number;
  limiteUsoTotal: number | null;
  limiteUsoPorCliente: number | null;
  totalUsos: number;
  dataInicio: Date;
  dataFim: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type ResultadoCuponsPromocaoAdmin = {
  cupons: CupomPromocaoAdmin[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type StatusPagamentoAuditoriaCupom =
  | "pending"
  | "paid"
  | "failed"
  | "expired";

export type UsoCupomAuditoriaAdmin = {
  id: string;
  codigoCupom: string;
  cupomId: string;
  pedidoId: string | null;
  numeroPedido: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  clienteEmail: string | null;
  descontoAplicadoEmCentavos: number;
  gateway: string | null;
  metodoPagamento: string | null;
  statusPagamento: StatusPagamentoAuditoriaCupom | null;
  dataUso: Date;
  origemGatewayWebhook: string;
};

export type InconsistenciaAuditoriaCupomAdmin = {
  id: string;
  tipo:
    | "pedido_pago_sem_uso"
    | "uso_sem_pagamento_aprovado"
    | "uso_duplicado"
    | "webhook_com_falha";
  severidade: "baixa" | "media" | "alta";
  titulo: string;
  descricao: string;
  pedidoId?: string | null;
  numeroPedido?: string | null;
  codigoCupom?: string | null;
  criadoEm?: Date | null;
};

export type ResumoAuditoriaCuponsAdmin = {
  totalUsosRegistrados: number;
  totalDescontoRegistradoEmCentavos: number;
  cuponsMaisUsados: Array<{
    codigoCupom: string;
    totalUsos: number;
    totalDescontoEmCentavos: number;
  }>;
  totalPedidosPagosSemUso: number;
  totalUsosSemPagamentoAprovado: number;
  totalDuplicidades: number;
  totalWebhooksComFalha: number;
};

export type ResultadoAuditoriaCuponsAdmin = {
  usos: UsoCupomAuditoriaAdmin[];
  inconsistencias: InconsistenciaAuditoriaCupomAdmin[];
  resumo: ResumoAuditoriaCuponsAdmin;
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type PedidoAuditoriaFreteGratisAdmin = {
  pedidoId: string;
  numeroPedido: string;
  clienteId: string | null;
  clienteNome: string | null;
  clienteEmail: string | null;
  subtotalEmCentavos: number;
  freteOriginalEmCentavos: number;
  freteFinalEmCentavos: number;
  descontoFreteEmCentavos: number;
  regraFreteGratisId: string | null;
  regraPromocaoId: string | null;
  modalidadeAplicada: string | null;
  modalidadesElegiveis: string | null;
  regiaoAplicada: string | null;
  regioesElegiveis: string | null;
  transportadoraAplicada: string | null;
  transportadorasElegiveis: string | null;
  servicoAplicado: string | null;
  servicosElegiveis: string | null;
  tipoPrioridadeFreteGratis: string | null;
  regrasIgnoradasPorPrecedencia: string | null;
  gatewayPagamento: string | null;
  metodoPagamento: string | null;
  statusPagamento: StatusPagamentoAuditoriaCupom | null;
  dataPedido: Date;
};

export type ResumoAuditoriaFreteGratisAdmin = {
  totalPedidosComFreteGratis: number;
  totalDescontoFreteEmCentavos: number;
  ticketMedioEmCentavos: number;
  regraMaisUsada: {
    regraFreteGratisId: string;
    totalPedidos: number;
    totalDescontoEmCentavos: number;
  } | null;
};

export type ResultadoAuditoriaFreteGratisAdmin = {
  pedidos: PedidoAuditoriaFreteGratisAdmin[];
  resumo: ResumoAuditoriaFreteGratisAdmin;
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type OrigemDiagnosticoOfertaRelampago =
  | "oficial"
  | "legado"
  | "sem_promocao";

export type StatusDiagnosticoOfertaRelampago =
  | "oficial_validado"
  | "legado_migrado"
  | "usando_legado"
  | "divergente"
  | "sem_promocao";

export type ItemDiagnosticoOfertaRelampagoAdmin = {
  chave: string;
  produtoId: string;
  produto: string;
  slug: string;
  sku: string;
  modalidade: string;
  varianteId: string | null;
  produtoVariavel: boolean;
  precoOriginalEmCentavos: number;
  precoPromocionalEmCentavos: number;
  badge: string | null;
  countdownDataFim: Date | null;
  origem: OrigemDiagnosticoOfertaRelampago;
  status: StatusDiagnosticoOfertaRelampago;
  motivo: string;
  oficial: {
    ativo: boolean;
    regraPromocaoId: string | null;
    precoPromocionalEmCentavos: number | null;
    badge: string | null;
    countdownDataFim: Date | null;
  };
  legado: {
    ativo: boolean;
    migrado: boolean;
    migradoEm: Date | null;
    migradoParaRegraId: string | null;
    precoPromocionalEmCentavos: number | null;
    badge: string | null;
    countdownDataFim: Date | null;
  };
};

export type ResumoDiagnosticoOfertaRelampagoAdmin = {
  totalItens: number;
  totalOficiais: number;
  totalLegados: number;
  totalSemPromocao: number;
  totalOficiaisValidados: number;
  totalLegadosMigrados: number;
  totalUsandoLegado: number;
  totalDivergentes: number;
};

export type ResultadoDiagnosticoOfertasRelampagoAdmin = {
  itens: ItemDiagnosticoOfertaRelampagoAdmin[];
  resumo: ResumoDiagnosticoOfertaRelampagoAdmin;
  dataReferencia: Date;
};

export type StatusEstabilidadeMigracaoRelampago =
  | "estavel"
  | "instavel"
  | "precisa_revisao";

export type ItemEstabilidadeMigracaoRelampagoAdmin = {
  chave: string;
  produtoId: string;
  produto: string;
  sku: string;
  modalidade: string;
  regraPromocaoId: string | null;
  status: StatusEstabilidadeMigracaoRelampago;
  motivos: string[];
  precoLegadoEmCentavos: number | null;
  precoOficialEmCentavos: number | null;
  countdownLegadoDataFim: Date | null;
  countdownOficialDataFim: Date | null;
  oficialAtiva: boolean;
  legadoMigrado: boolean;
  legadoUsado: boolean;
  stockSemPromocao: boolean | null;
  migradoEm: Date | null;
};

export type ResumoEstabilidadeMigracaoRelampagoAdmin = {
  totalItens: number;
  totalEstaveis: number;
  totalInstaveis: number;
  totalPrecisamRevisao: number;
};

export type ResultadoEstabilidadeMigracaoRelampagoAdmin = {
  itens: ItemEstabilidadeMigracaoRelampagoAdmin[];
  resumo: ResumoEstabilidadeMigracaoRelampagoAdmin;
  dataReferencia: Date;
};
