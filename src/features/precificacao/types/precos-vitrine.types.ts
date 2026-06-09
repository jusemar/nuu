import type {
  ConfiguracaoPagamentoCalculavel,
  EntradaPrecificacaoProduto,
  PrecoProdutoCalculado,
  PromocaoPrecificacaoProduto,
} from "./precificacao.types";
import type {
  CountdownPromocionalLegadoAdaptado,
  TipoBadgePromocionalLegado,
  TipoCampanhaPromocionalLegada,
} from "../../promocoes/types/promocoes-legadas.types";

export type TipoPromocaoLegadaVitrine = "normal" | "flash";

export type PrecoModalidadeVitrineEntrada = {
  type: string;
  price: number;
  mainCardPrice?: boolean | null;
  pricingModalDescription?: string | null;
  deliveryDays?: string | null;
  hasPromo?: boolean | null;
  promoType?: TipoPromocaoLegadaVitrine | string | null;
  promoPrice?: number | null;
  promoEndDate?: Date | string | null;
  legadoPromocaoMigradoEm?: Date | string | null;
  legadoPromocaoMigradoParaRegraId?: string | null;
  isActive?: boolean | null;
};

export type VarianteVitrineEntrada = {
  id: string;
  sku?: string | null;
  name?: string | null;
  priceInCents: number;
  comparePriceInCents?: number | null;
  stockQuantity?: number | null;
  isActive?: boolean | null;
};

export type ProdutoVitrinePrecificavel = {
  id: string;
  productKind?: string | null;
  pricing?: PrecoModalidadeVitrineEntrada[] | null;
  variants?: VarianteVitrineEntrada[] | null;
};

export type PromocaoLegadaVitrine = {
  ativa: boolean;
  tipo: TipoPromocaoLegadaVitrine | null;
  precoPromocionalEmCentavos: number | null;
  descontoAplicadoEmCentavos: number;
  dataFim: Date | null;
  regraPromocaoId: string | null;
  tipoCampanha: TipoCampanhaPromocionalLegada | null;
  badge: TipoBadgePromocionalLegado | null;
  countdown: CountdownPromocionalLegadoAdaptado;
};

export type OrigemPrecoVitrine = "modalidade" | "variante";
export type OrigemPromocaoVitrine =
  | "sem_promocao"
  | "legado"
  | "promotion_engine";

export type PrecoVitrineNormalizado = {
  chave: string;
  produtoId: string;
  modalidade: string;
  origem: OrigemPrecoVitrine;
  varianteId: string | null;
  produtoVariavel: boolean;
  modalidadePrincipal: boolean;
  precoBaseEmCentavos: number;
  precoOriginalEmCentavos: number;
  precoFinalEmCentavos: number;
  precoPromocionalLegadoEmCentavos: number | null;
  promocaoLegada: PromocaoLegadaVitrine;
  promocaoEngine: PromocaoPrecificacaoProduto;
  promocaoLegadaEngine: PromocaoPrecificacaoProduto;
  legadoIgnoradoPorOficial: boolean;
  legadoPromocaoMigradoEm: Date | null;
  legadoPromocaoMigradoParaRegraId: string | null;
  origemPromocaoAplicada: OrigemPromocaoVitrine;
  tipoCampanhaPromocional: TipoCampanhaPromocionalLegada | null;
  badgePromocional: TipoBadgePromocionalLegado | null;
  countdownPromocional: CountdownPromocionalLegadoAdaptado;
  possuiPromocao: boolean;
  descontoAplicadoEmCentavos: number;
  percentualOff: number;
  economiaEmCentavos: number;
  precificacao: PrecoProdutoCalculado;
};

export type ProdutoVitrineNormalizado = {
  produtoId: string;
  produtoVariavel: boolean;
  precoPrincipal: PrecoVitrineNormalizado | null;
  precos: PrecoVitrineNormalizado[];
};

export type PrecoPrincipalCompatibilidadeVitrine = {
  price: number;
  promoPrice: number | null;
  hasPromo: boolean;
  type: string;
  precoOriginalEmCentavos: number;
  precoFinalEmCentavos: number;
  percentualOff: number;
  economiaEmCentavos: number;
  origemPromocaoAplicada: OrigemPromocaoVitrine;
  tipoCampanhaPromocional: TipoCampanhaPromocionalLegada | null;
  badgePromocional: TipoBadgePromocionalLegado | null;
  countdownPromocional: CountdownPromocionalLegadoAdaptado;
  countdownPromocionalDataFim: Date | null;
  origem: OrigemPrecoVitrine;
  varianteId: string | null;
};

export type PrecosVitrineNormalizados = {
  precosPorChave: Record<string, PrecoVitrineNormalizado>;
  produtosPorId: Record<string, ProdutoVitrineNormalizado>;
};

export type DependenciasAdaptadorPrecosVitrine = {
  buscarConfiguracao?: () => Promise<ConfiguracaoPagamentoCalculavel>;
  aplicarPromocoes?: (entradas: EntradaPrecificacaoProduto[]) => Promise<
    {
      entrada: EntradaPrecificacaoProduto;
      promocao: PromocaoPrecificacaoProduto;
    }[]
  >;
};
