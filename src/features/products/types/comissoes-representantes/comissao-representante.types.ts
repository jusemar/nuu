import type { z } from "zod";

import type {
  atribuicaoComissaoSchema,
  calcularComissaoRepresentanteSchema,
  regraComissaoAtribuidaSchema,
} from "../../schemas/comissoes-representantes/comissao-representante.schema";

export type AtribuicaoComissaoRepresentante = z.infer<
  typeof atribuicaoComissaoSchema
>;
export type RegraComissaoAtribuida = z.infer<
  typeof regraComissaoAtribuidaSchema
>;
export type EntradaCalculoComissaoRepresentante = z.input<
  typeof calcularComissaoRepresentanteSchema
>;
/** Contrato serializável para futura persistência; versão nunca acompanha o preço atual. */
export type SnapshotComissaoRepresentante = Readonly<{
  versaoContrato: 1;
  ocorridoEm: string;
  atribuicao: Readonly<AtribuicaoComissaoRepresentante>;
  regra: Readonly<{
    autorizacaoId: string;
    versao: string;
    tipo: "percentual" | "fixa";
    valor: number;
    ativa: true;
  }>;
  item: Readonly<{
    quantidade: number;
    precoUnitarioVendidoCentavos: number;
    descontoItemCentavos: number;
    valorLiquidoItemCentavos: number;
  }>;
  comissaoCentavos: number;
  arredondamento: "meio_para_cima_por_item";
}>;
