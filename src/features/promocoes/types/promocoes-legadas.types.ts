import type {
  RegraPromocaoCalculavel,
  StatusPromocao,
  VinculoProdutoPromocaoCalculavel,
} from "./promocoes.types";

export type TipoPromocaoLegada = "normal" | "flash";
export type TipoCampanhaPromocionalLegada =
  | "promocao_normal"
  | "oferta_relampago";
export type TipoBadgePromocionalLegado = "promocao" | "relampago";

export type PromocaoLegadaEntrada = {
  produtoId: string;
  modalidade: string;
  precoBaseEmCentavos: number;
  idPrecoLegado?: string | null;
  hasPromo?: boolean | null;
  promoType?: TipoPromocaoLegada | string | null;
  promoPrice?: number | null;
  promoEndDate?: Date | string | null;
  legadoPromocaoMigradoEm?: Date | string | null;
  legadoPromocaoMigradoParaRegraId?: string | null;
  mainCardPrice?: boolean | null;
};

export type CountdownPromocionalLegadoAdaptado = {
  ativo: boolean;
  dataFim: Date | null;
};

export type CampanhaPromocionalLegadaAdaptada = {
  id: string;
  regraPromocaoId: string;
  produtoId: string;
  modalidade: string;
  tipoCampanha: TipoCampanhaPromocionalLegada;
  tipoPromocaoLegada: TipoPromocaoLegada;
  status: StatusPromocao;
  badge: TipoBadgePromocionalLegado;
  countdown: CountdownPromocionalLegadoAdaptado;
  precoOriginalEmCentavos: number;
  precoPromocionalEmCentavos: number;
  descontoEmCentavos: number;
  origem: "product_pricing";
};

export type ResultadoAdaptacaoPromocoesLegadas = {
  regras: RegraPromocaoCalculavel[];
  produtosPromocao: VinculoProdutoPromocaoCalculavel[];
  campanhas: CampanhaPromocionalLegadaAdaptada[];
  avisos: string[];
};

export type OpcoesAdaptacaoPromocoesLegadas = {
  dataReferencia?: Date;
};
