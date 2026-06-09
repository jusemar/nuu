export const tiposDescontoPromocao = ["percentual", "valor_fixo"] as const;
export const statusPromocao = [
  "ativa",
  "inativa",
  "agendada",
  "encerrada",
] as const;
export const tiposCampanhaPromocao = ["normal", "relampago"] as const;
export const tiposBeneficioPromocao = ["desconto", "frete_gratis"] as const;

export type TipoDescontoPromocao = (typeof tiposDescontoPromocao)[number];
export type StatusPromocao = (typeof statusPromocao)[number];
export type TipoCampanhaPromocao = (typeof tiposCampanhaPromocao)[number];
export type TipoBeneficioPromocao = (typeof tiposBeneficioPromocao)[number];

export type ItemEntradaPromocao = {
  produtoId: string;
  modalidade?: string | null;
  categoriaId?: string | null;
  marcaId?: string | null;
  quantidade: number;
  precoBaseEmCentavos: number;
};

export type RegraPromocaoCalculavel = {
  id: string;
  nome: string;
  slug: string;
  status: StatusPromocao;
  tipoBeneficio: TipoBeneficioPromocao;
  tipoCampanha: TipoCampanhaPromocao;
  tipoDesconto: TipoDescontoPromocao;
  prioridade: number;
  acumulativa: boolean;
  dataInicio: Date;
  dataFim: Date | null;
  badgePromocional: string | null;
  countdownPromocionalDataFim: Date | null;
};

export type VinculoProdutoPromocaoCalculavel = {
  id: string;
  regraPromocaoId: string;
  produtoId: string;
  modalidade: string | null;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
};

export type VinculoCategoriaPromocaoCalculavel = {
  id: string;
  regraPromocaoId: string;
  categoriaId: string;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
};

export type VinculoMarcaPromocaoCalculavel = {
  id: string;
  regraPromocaoId: string;
  marcaId: string;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
};

export type RegraSubtotalPromocaoCalculavel = {
  id: string;
  regraPromocaoId: string;
  subtotalMinimo: number;
  subtotalMaximo: number | null;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
};

export type RegraFreteGratisPromocaoCalculavel = {
  id: string;
  regraPromocaoId: string;
  subtotalMinimo: number;
  modalidade: string | null;
  mensagemProgressiva: string | null;
  regiaoCodigo: string | null;
  transportadoraCodigo: string | null;
  servicoCodigo: string | null;
};

export type CupomPromocaoCalculavel = {
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
  usosCliente: number;
  dataInicio: Date;
  dataFim: Date | null;
};

export type ContextoCalculoPromocao = {
  dataReferencia: Date;
  subtotalEmCentavos: number | null;
  codigosCupons: string[];
  clienteId: string | null;
};

export type EntradaCalculoPromocoes = {
  itens: ItemEntradaPromocao[];
  regras?: RegraPromocaoCalculavel[];
  produtosPromocao?: VinculoProdutoPromocaoCalculavel[];
  categoriasPromocao?: VinculoCategoriaPromocaoCalculavel[];
  marcasPromocao?: VinculoMarcaPromocaoCalculavel[];
  subtotaisPromocao?: RegraSubtotalPromocaoCalculavel[];
  fretesGratisPromocao?: RegraFreteGratisPromocaoCalculavel[];
  cuponsPromocao?: CupomPromocaoCalculavel[];
  contexto?: Partial<ContextoCalculoPromocao>;
};

export type EscopoPromocaoAplicada =
  | "produto"
  | "categoria"
  | "marca"
  | "subtotal"
  | "cupom";

export type PromocaoAplicada = {
  regraPromocaoId: string;
  cupomPromocaoId: string | null;
  nome: string;
  tipoDesconto: TipoDescontoPromocao;
  valorDescontoEmCentavos: number;
  valorConfigurado: number;
  escopo: EscopoPromocaoAplicada;
  codigoCupom: string | null;
  tipoCampanha: TipoCampanhaPromocao;
  badgePromocional: string | null;
  countdownPromocionalDataFim: Date | null;
};

export type ItemPromocaoCalculado = ItemEntradaPromocao & {
  preco_original: number;
  preco_final: number;
  desconto_aplicado: number;
  regra_aplicada: string | null;
  tipo_desconto: TipoDescontoPromocao | null;
  valor_desconto: number;
  escopo_promocao: EscopoPromocaoAplicada | null;
  descontoEmCentavos: number;
  precoFinalEmCentavos: number;
  tipoCampanha: TipoCampanhaPromocao | null;
  badgePromocional: string | null;
  countdownPromocionalDataFim: Date | null;
  promocoesAplicadas: PromocaoAplicada[];
};

export type ResultadoCalculoPromocoes = {
  sucesso: true;
  contexto: ContextoCalculoPromocao;
  itens: ItemPromocaoCalculado[];
  totalDescontoEmCentavos: number;
  regrasAvaliadas: RegraPromocaoCalculavel[];
  regrasAplicadas: PromocaoAplicada[];
  avisos: string[];
};
